"""Main request handlers."""

import json
import logging

from google.appengine.api import memcache
from google.appengine.api import oauth
from google.appengine.api import users
from google.appengine.api import xmpp
import webapp2

import models


class BaseHandler(webapp2.RequestHandler):
  """Base class for all handlers.

  Ensures that all requests provide valid auth credentials, either GAE login
  cookie or OAuth access token.
  """

  def __init__(self, request, response):
    super(BaseHandler, self).__init__(request, response)
    user = users.get_current_user()
    if user:
      logging.debug('User authenticated via SACSID cookie: ' + user.email())
    else:
      try:
        user = oauth.get_current_user()
        logging.debug('User authenticated via OAuth token: ' + user.email())
      except oauth.InvalidOAuthParametersError:
        pass
    if not user:
      logging.info('No valid user authentication credentials supplied')
      self.user = None
      return

    self.user = models.User.get_or_insert(user.user_id(), email=user.email())
    if self.user.email != user.email():
      self.user.email = user.email()
      self.user.put()

  def dispatch(self):
    if not self.user and self.request.method != 'OPTIONS':
      return self.redirect(users.create_login_url(self.request.path))
    super(BaseHandler, self).dispatch()


class PortalsHandler(BaseHandler):
  """Handler for the portals collection resource."""

  def get(self):
    portals = memcache.get('portals') or []
    if not portals:
      logging.info('Pulling portals from datastore')
      portals = list(models.Portal.all())
      memcache.set('portals', portals)
    portals_json = []
    for portal in portals:
      portals_json.append({
          'title': portal.title, 'latE6': portal.latE6, 'lngE6': portal.lngE6,
          'address': portal.address,
          'watched': self.user.key() in portal.subscribers,
          })
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(")]}',\n" + json.dumps(portals_json))


class PortalHandler(BaseHandler):
  """Handler for the portal instance resource."""

  def put(self, _lat, _lng):
    logging.debug(self.request.body)
    kwargs = json.loads(self.request.body)
    portal = models.Portal.get_or_insert(added_by=self.user, **kwargs)
    if kwargs.get('watched'):
      xmpp.send_invite(self.user.email)
      if self.user.key() not in portal.subscribers:
        portal.subscribers.append(self.user.key())
    else:
      try:
        portal.subscribers.remove(self.user.key())
      except ValueError:
        pass
    portal.put()

  def options(self, _lat, _lng):
    self.response.headers.add(
        'Access-Control-Allow-Credentials', 'true')
    self.response.headers.add(
        'Access-Control-Allow-Origin', 'http://www.ingress.com')
    self.response.headers.add(
        'Access-Control-Allow-Methods', 'PUT')
    self.response.headers.add(
        'Access-Control-Max-Age', '1728000')


APP = webapp2.WSGIApplication([
    (r'/portals', PortalsHandler),
    (r'/portals/(\d+),(-?\d+)', PortalHandler),
])

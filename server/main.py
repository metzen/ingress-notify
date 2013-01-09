"""Main request handlers."""

import collections
import datetime
import json
import logging

from google.appengine.api import memcache
from google.appengine.api import oauth
from google.appengine.api import users
from google.appengine.api import xmpp
from google.appengine.ext import db
import webapp2

import memcache_chunker
import models
import util


class PortalJSONEncoder(json.JSONEncoder):
  """JSON Encoder for models.Portal."""

  def default(self, o):
    if isinstance(o, collections.Iterable):
      return [self.default(portal) for portal in o]
    if isinstance(o, models.Portal):
      return {
          'title': o.title, 'latE6': o.latE6, 'lngE6': o.lngE6,
          'address': o.address,
          }
    return super(PortalJSONEncoder, self).default(o)


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
      except oauth.InvalidOAuthTokenError:
        logging.info('User provided an invalid OAuth token')
        self.abort(401, explanation='Invalid OAuth token')
      except oauth.InvalidOAuthParametersError:
        pass
    if not user:
      logging.info('No valid user authentication credentials supplied')
      self.user = None
      return

    key = models.User.get_memcache_key(user.user_id())
    self.user = memcache.get(key)
    if self.user is None:
      self.user = models.User.get_or_insert(user.user_id(), email=user.email())
      memcache.set(key, self.user)
    if self.user.email != user.email():
      self.user.email = user.email()
      memcache.set(key, self.user)
    self.user.last_visit_at = datetime.datetime.now()
    db.put_async(self.user)

  def dispatch(self):
    if not self.user and self.request.method != 'OPTIONS':
      return self.redirect(users.create_login_url(self.request.path))
    super(BaseHandler, self).dispatch()


class PortalsHandler(BaseHandler):
  """Handler for the portals collection resource."""

  def get(self):
    self.response.headers['Content-Type'] = 'application/json'
    portals_query = models.Portal.all()
    if self.request.get('watched'):
      key = 'watched-portals|%s' % self.user.key()
      portals_json = memcache.get(key)
      if not portals_json:
        portals_query.filter('subscribers', self.user.key())
        portals_json = json.dumps(
            portals_query.run(batch_size=1000), cls=PortalJSONEncoder)
        memcache.set(key, portals_json)
    else:
      key = 'portals'
      portals_json = memcache_chunker.get(key)
      if not portals_json:
        logging.info('Pulling portals from datastore')
        portals_json = json.dumps(
            portals_query.run(batch_size=1000), cls=PortalJSONEncoder)
        memcache_chunker.set(key, portals_json)
    self.response.out.write(")]}',\n" + portals_json)


class PortalHandler(BaseHandler):
  """Handler for the portal instance resource."""

  def put(self, lat, lng):
    logging.debug(self.request.body)
    kwargs = json.loads(self.request.body)
    if not kwargs.get('address'):
      kwargs['address'] = util.lookup_address(lat, lng)
    portal, created = models.Portal.get_or_insert(added_by=self.user, **kwargs)
    if created:
      # Add it to the cached JSON list of all portals.
      portals_json = memcache_chunker.get('portals')
      if portals_json is not None:
        portals = json.loads(portals_json)
        portals.append(portal)
        memcache_chunker.set('portals', json.dumps(
            portals, cls=PortalJSONEncoder))
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
    memcache.delete('watched-portals|%s' % self.user.key())

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
    (r'/portals/(-?\d+),(-?\d+)', PortalHandler),
])

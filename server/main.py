import json
import logging

from google.appengine.api import users
from google.appengine.api import oauth
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
    if not user:
      try:
        user = oauth.get_current_user()
      except oauth.InvalidOAuthParametersError:
        pass
    if not user:
      self.user = None
      return

    self.user = models.User.get_or_insert(user.user_id(), email=user.email())
    if self.user.email != user.email():
      self.user.email = user.email()
      self.user.put()

  def dispatch(self):
    if not self.user:
      return self.redirect(users.create_login_url(self.request.path))
    super(BaseHandler, self).dispatch()


class PortalsHandler(BaseHandler):
  """Handler for the portals collection resource."""

  def get(self):
    portals = []
    for p in models.Portal.all():
      portals.append({
          'name': p.name, 'latE6': p.latE6, 'lngE6': p.lngE6,
          'watched': self.user.key() in p.subscribers,
          })
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(")]}',\n" + json.dumps(portals))


class PortalHandler(BaseHandler):
  """Handler for the portal instance resource."""

  def __init__(self, request, response):
    super(PortalHandler, self).__init__(request, response)
    args = self.request.route_args
    self.portal = models.Portal.get_or_insert(
        int(args[0]), int(args[1]), args[2], self.user)


class PortalWatchHandler(PortalHandler):
  """Handler for the portal instance watch resource."""

  def get(self, lat, lng, name):
    if self.user.key() not in self.portal.subscribers:
      self.error(404)

  def put(self, lat, lng, name):
    if self.user.key() not in self.portal.subscribers:
      self.portal.subscribers.append(self.user.key())
      self.portal.put()
    self.response.out.write('watch added')
    xmpp.send_invite(self.user.email)

  def delete(self, lat, lng, name):
    try:
      self.portal.subscribers.remove(self.user.key())
    except ValueError:
      pass
    else:
      self.portal.put()
    self.response.out.write('watch removed')


class XMPPHandler(webapp2.RequestHandler):
  def post(self):
    message = xmpp.Message(self.request.POST)
    logging.info(message.body)
    logging.info(self.request.POST['stanza'])


app = webapp2.WSGIApplication([
    ('/portals', PortalsHandler),
    ('/portals/(\d+),(-?\d+)-([^/]+)', PortalHandler),
    ('/portals/(\d+),(-?\d+)-([^/]+)/watch', PortalWatchHandler),
])

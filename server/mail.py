"""Incoming mail handler."""

import logging
import re
import urllib2

from google.appengine.api import xmpp
from google.appengine.ext.webapp import mail_handlers
import webapp2

import models

REQUESTER_RE = re.compile('(.*?) has requested')
CONFIRMATION_RE = re.compile(r'(http.*%40ingress-notify\.appspotmail\.com.*)')
LATITUDE_RE = re.compile(r'latE6=(-?\d+)')
LONGITUDE_RE = re.compile(r'lngE6=(-?\d+)')
PORTAL_URL_RE = re.compile(r'"(http://www.ingress.com/intel.*?)"')


class Handler(mail_handlers.InboundMailHandler):
  """Incoming mail handler."""

  def receive(self, mail_message):
    if 'Gmail Forwarding Confirmation' in mail_message.subject:
      logging.info('Received Gmail forwarding request')
      for _content_type, body in mail_message.bodies('text/plain'):
        decoded_body = body.decode()
        logging.debug(
            'Gmail forwarding confirmation mail body:\n' + decoded_body)
        match = REQUESTER_RE.search(decoded_body)
        requester = match.group(1)
        logging.info("Registering '%s'", requester)
        match = CONFIRMATION_RE.search(decoded_body)
        urllib2.urlopen(match.group(0))
    else:
      logging.info('Received Ingress notification mail')

      for _content_type, body in mail_message.bodies('text/html'):
        decoded_body = body.decode()
        logging.info('decoded body: %s', decoded_body)
        try:
          url = PORTAL_URL_RE.search(decoded_body).group(1)
          lat = int(LATITUDE_RE.search(decoded_body).group(1))
          lng = int(LONGITUDE_RE.search(decoded_body).group(1))
        except AttributeError:
          logging.error('Failed to parse notification mail')
        else:
          logging.info('Portal coordinates: (%d, %d)', lat, lng)
          portal = models.Portal.get_by_lat_lng(lat, lng)
          if not portal:
            logging.info('Unknown portal')
          elif portal.subscribers:
            logging.info('Portal has subscribers; sending alerts')
            users = models.User.get(portal.subscribers)
            xmpp.send_message(
                [user.email for user in users],
                'Alert! *%s* is under attack! %s' % (portal.title, url))


APP = webapp2.WSGIApplication([Handler.mapping()])

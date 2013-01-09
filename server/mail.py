"""Incoming mail handler."""

import logging
import re
import urllib2

from google.appengine.api import memcache
from google.appengine.api import xmpp
from google.appengine.ext.webapp import mail_handlers
import webapp2

import models

CONFIRMATION_RE = re.compile(r'(http.*%40ingress-notify\.appspotmail\.com.*)')
LATITUDE_RE = re.compile(r'latE6=(-?\d+)')
LONGITUDE_RE = re.compile(r'lngE6=(-?\d+)')
PORTAL_URL_RE = re.compile(r'"(http://www.ingress.com/intel.*?)"')
ATTACKER_RE = re.compile(r'destroyed by (\w+) ')


class Handler(mail_handlers.InboundMailHandler):
  """Incoming mail handler."""

  def receive(self, mail_message):
    logging.debug('Received mail from: %s', mail_message.sender)
    logging.debug('Subject: %s', getattr(mail_message, 'subject', ''))
    if 'mail-noreply@google.com' in mail_message.sender:
      logging.info('Received Gmail forwarding request')
      for _content_type, body in mail_message.bodies('text/plain'):
        decoded_body = body.decode()
        logging.debug(
            'Gmail forwarding confirmation mail body:\n' + decoded_body)
        match = CONFIRMATION_RE.search(decoded_body)
        urllib2.urlopen(match.group(0))
        logging.info('Forwarding request confirmed')
    elif 'ingress-support@google.com' in mail_message.sender:
      logging.info('Received Ingress notification mail')

      for _content_type, body in mail_message.bodies('text/html'):
        decoded_body = body.decode()
        logging.info('decoded body: %s', decoded_body)
        try:
          url = PORTAL_URL_RE.search(decoded_body).group(1)
          lat = int(LATITUDE_RE.search(decoded_body).group(1))
          lng = int(LONGITUDE_RE.search(decoded_body).group(1))
          m = ATTACKER_RE.search(decoded_body)
          attacker = m.group(1) if m else None
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
            send_message(users, portal, url, attacker)
    else:
      logging.info('Received non-interesting mail')


def send_message(users, portal, url, attacker):
  portal_keyname = portal.key().name()
  emails = [
      user.email for user in users
      if memcache.add('%s|||%s' % (portal_keyname, user.email), 1, time=120)]
  if emails:
    msg = 'Alert! *%s* (%s) is under attack%s! %s' % (
        portal.title.strip(), portal.address,
        (' by ' + attacker) if attacker else '', url)
    xmpp.send_message(emails, msg)


APP = webapp2.WSGIApplication([Handler.mapping()])

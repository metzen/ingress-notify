import logging
import re
import urllib2

from google.appengine.api import memcache
from google.appengine.api import mail
from google.appengine.api import xmpp
from google.appengine.ext import db
from google.appengine.ext.webapp import mail_handlers
import webapp2

import models

REQUESTER_RE = re.compile('(.*?) has requested')
CONFIRMATION_RE = re.compile(r'(.*isolated.mail.google.com.*)')
LATITUDE_RE = re.compile(r'latE6=(-?\d+)')
LONGITUDE_RE = re.compile(r'lngE6=(-?\d+)')
PORTAL_URL_RE = re.compile(r'"(http://www.ingress.com/intel.*?)"')


class Handler(mail_handlers.InboundMailHandler):

  def receive(self, mail_message):
    if 'Gmail Forwarding Confirmation' in mail_message.subject:
      logging.info('Received Gmail forwarding request')
      for content_type, body in mail_message.bodies('text/plain'):
        decoded_body = body.decode()
        m = REQUESTER_RE.search(decoded_body)
        requester = m.group(1)
        logging.info("Registering '%s'" % requester)
        m = CONFIRMATION_RE.search(decoded_body)
        urllib2.urlopen(m.group(0))
    else:
      logging.info('Received Ingress notification mail')

      for content_type, body in mail_message.bodies('text/html'):
        decoded_body = body.decode()
        logging.info('decoded body: %s' % decoded_body)
        try:
          url = PORTAL_URL_RE.search(decoded_body).group(1)
          lat = int(LATITUDE_RE.search(decoded_body).group(1))
          lng = int(LONGITUDE_RE.search(decoded_body).group(1))
        except AttributeError:
          logging.error('Failed to parse notification mail')
        else:
          logging.info('Portal coordinates: (%d, %d)' % (lat, lng))
          portal = models.Portal.get_by_lat_lng(lat, lng)
          if not portal:
            logging.info('Unknown portal')
          elif portal.subscribers:
            logging.info('Portal has subscribers; sending alerts')
            users = models.User.get(portal.subscribers)
            SendMessage(users, portal, url)


def SendMessage(users, portal, url):
  portal_keyname = portal.key().name()
  emails = [
      user.email for user in users
      if memcache.add('%s|||%s' % (portal_keyname, user.email), 1, time=120)]
  if emails:
    msg = 'Alert! *%s* is under attack! %s' % (portal.title, url)
    xmpp.send_message(emails, msg)


app = webapp2.WSGIApplication([Handler.mapping()])

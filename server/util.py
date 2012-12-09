"""Utility functions."""

import json
import urllib2

MAPS_API_URL = (
    'https://maps.googleapis.com/maps/api/geocode/json?'
    'latlng=%f,%f&sensor=false')


def lookup_address(latE6, lngE6):
  """Perform a reverse geocoding lookup for the given lat,lng pair."""
  response = urllib2.urlopen(
        MAPS_API_URL % (float(latE6) / 10.0 ** 6, float(lngE6) / 10.0 ** 6))
  data = json.loads(response.read())
  if data['results']:
    return data['results'][0]['formatted_address']

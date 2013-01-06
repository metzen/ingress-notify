"""Memcache API with chunking support for storing large objects."""

import pickle

from google.appengine.api import memcache


def set(key, value, chunksize=950000):
  serialized = pickle.dumps(value, 2)
  values = {}
  for i in xrange(0, len(serialized), chunksize):
    values['%s.%s' % (key, i // chunksize)] = serialized[i:i + chunksize]
  memcache.set_multi(values)


def get(key):
  result = memcache.get_multi(['%s.%s' % (key, i) for i in xrange(32)])
  serialized = ''.join([v for v in result.values() if v is not None])
  try:
    return pickle.loads(serialized)
  except:  # TODO: Use a more specific exception type.
    return None

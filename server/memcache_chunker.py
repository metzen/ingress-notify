"""Memcache API with chunking support for storing large objects."""

import pickle

from google.appengine.api import memcache


def set(key, value, chunksize=950000):
  serialized = pickle.dumps(value, 2)
  values = {}
  for i in xrange(0, len(serialized), chunksize):
    values['%s' % (i // chunksize)] = serialized[i:i + chunksize]
  memcache.set_multi(values, key_prefix=key + '.')


def get(key):
  keys = [str(i) for i in xrange(32)]
  result = memcache.get_multi(keys, key_prefix=key + '.')
  result_values = [result.get(k) for k in keys]
  serialized = ''.join([v for v in result_values if v is not None])
  try:
    return pickle.loads(serialized)
  except:  # TODO: Use a more specific exception type.
    return None

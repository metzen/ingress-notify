"""Data models."""

from google.appengine.api import memcache
from google.appengine.ext import db


class User(db.Model):
  # key: User.user_id()
  email = db.StringProperty()

  @classmethod
  def get_memcache_key(cls, user_id):
    return 'User|%s' % user_id


class Portal(db.Model):
  # key: latE6,lngE6
  title = db.StringProperty()
  latE6 = db.IntegerProperty()
  lngE6 = db.IntegerProperty()
  address = db.StringProperty()
  subscribers = db.ListProperty(db.Key)  # User keys.
  added_by = db.ReferenceProperty(User)
  added_on = db.DateTimeProperty(auto_now_add=True)

  @classmethod
  def get_by_lat_lng(cls, lat, lng):
    return cls.get_by_key_name('%s,%s' % (lat, lng))

  @classmethod
  def create(cls, latE6, lngE6, **kwargs):
    obj = cls(
        key_name='%s,%s' % (latE6, lngE6), latE6=latE6, lngE6=lngE6, **kwargs)
    obj.put()

  @classmethod
  def get_or_insert(cls, latE6, lngE6, **kwargs):
    def txn(key_name, **kwds):
      created = False
      entity = cls.get_by_key_name(key_name, parent=kwds.get('parent'))
      if entity is None:
        entity = cls(key_name=key_name, **kwds)
        entity.put()
        created = True
      return entity, created
    return db.run_in_transaction(
        txn, '%s,%s' % (latE6, lngE6), latE6=latE6, lngE6=lngE6, **kwargs)

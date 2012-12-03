from google.appengine.api import memcache
from google.appengine.ext import db


class User(db.Model):
  # key: User.user_id()
  email = db.StringProperty()


class Portal(db.Model):
  # key: latE6,lngE6
  name = db.StringProperty()
  latE6 = db.IntegerProperty()
  lngE6 = db.IntegerProperty()
  subscribers = db.ListProperty(db.Key)  # User keys.
  added_by = db.ReferenceProperty(User)
  added_on = db.DateTimeProperty(auto_now_add=True)

  def put(self, *args, **kwargs):
    super(Portal, self).put(*args, **kwargs)
    memcache.delete('portals')

  @classmethod
  def get_by_lat_lng(cls, lat, lng):
    return cls.get_by_key_name('%s,%s' % (lat, lng))

  @classmethod
  def create(cls, lat, lng, name):
    obj = cls(key_name='%s,%s' % (lat, lng))
    obj.name = name
    obj.put()

  @classmethod
  def get_or_insert(cls, lat, lng, name, added_by):
    return super(Portal, cls).get_or_insert(
        '%s,%s' % (lat, lng), name=name, latE6=lat, lngE6=lng,
        added_by=added_by)

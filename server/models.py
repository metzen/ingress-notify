from google.appengine.api import memcache
from google.appengine.ext import db


class User(db.Model):
  # key: User.user_id()
  email = db.StringProperty()


class Portal(db.Model):
  # key: latE6,lngE6
  title = db.StringProperty()
  latE6 = db.IntegerProperty()
  lngE6 = db.IntegerProperty()
  address = db.StringProperty()
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
  def create(cls, latE6, lngE6, **kwargs):
    obj = cls(
        key_name='%s,%s' % (latE6, lngE6), latE6=latE6, lngE6=lngE6, **kwargs)
    obj.put()

  @classmethod
  def get_or_insert(cls, latE6, lngE6, **kwargs):
    return super(Portal, cls).get_or_insert(
        '%s,%s' % (latE6, lngE6), latE6=latE6, lngE6=lngE6, **kwargs)

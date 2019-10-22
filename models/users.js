const User = require('../lib/mongo').User

module.exports = {
  // 注册一个用户
  create: function create (user) {
    return User.insertOne(user).exec()
  },

  // 通过用户名获取用户信息
  getUserByName: function getUserByName (name) {
    return User
      .findOne({ name: name })
      .addCreatedAt()
      .exec()
  },
  // 更改用户密码
  changePassword: function changePassword (userId, data) {
    return User.update({ _id: userId }, { $set: data }).exec();
  }
}
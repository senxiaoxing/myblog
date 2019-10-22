module.exports = {
    port: 4000,
    session: {
      secret: 'myblog',
      key: 'myblog',
      maxAge: 2592000000
    },
    //mongodb+srv://jasonyang:<password>@myblog-pvdpj.mongodb.net/test?retryWrites=true&w=majority
    mongodb: 'mongodb://localhost:27017/myblog',
    size: {
      postSize: 5,
      tagSize: 5
    }
  }
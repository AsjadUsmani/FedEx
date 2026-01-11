import bcrypt from 'bcrypt'

bcrypt.hash("admin123", 10).then(console.log);
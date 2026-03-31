import bcrypt from "bcrypt";
const saltRounds = 10;

const password = '1'; // замените на нужный пароль
bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) console.error(err);
    else console.log(hash);
});
////node hash.js
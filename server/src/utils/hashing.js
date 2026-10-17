import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function hash(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function compare(password, hash) {
    return bcrypt.compare(password, hash);
}
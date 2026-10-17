
import { nanoid } from "nanoid";

// import {
//     uniqueNamesGenerator,
//     adjectives,
//     animals,
//     numbers
// } from "unique-names-generator";

/**
 * Generates a username from an email address.
 *
 * Example:
 * john.doe@gmail.com
 * ↓
 * john_doe_x7k9
 *
 * @param {string} email
 * @returns {string}
 */
export function generateFromEmail(email) {
    const prefix = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

    const suffix = nanoid(6).toLowerCase();

    return `${prefix}_${suffix}`;
}

/**
 * Generates a random username.
 *
 * Example:
 * brave_otter_x9q2
 *
 * Useful for applications that don't require usernames
 * during registration. Uses nanoid for suffix generation.
 *
 * @returns {string}
 */
export function generateRandom() {

    const adjectives = [
        "brave",
        "swift",
        "silent",
        "happy",
        "clever",
        "wild",
        "cosmic",
        "epic",
        "lucky",
        "bright",
        "rapid",
        "mighty"
    ];

    const nouns = [
        "otter",
        "falcon",
        "wolf",
        "tiger",
        "fox",
        "hawk",
        "lion",
        "panda",
        "phoenix",
        "dragon",
        "bear",
        "raven"
    ];

    const adjective =
        adjectives[Math.floor(Math.random() * adjectives.length)];

    const noun =
        nouns[Math.floor(Math.random() * nouns.length)];

    return `${adjective}_${noun}_${nanoid(8)}`;
}

/**
 * Generates a random username via unique-names-generator API.
 *
 * @returns {string}
 */
// export function uniqueNameGenAPI() { 
//   return  uniqueNamesGenerator({
//     dictionaries: [adjectives, animals, numbers],
//     separator: "_",
//     length: 3 });
// }
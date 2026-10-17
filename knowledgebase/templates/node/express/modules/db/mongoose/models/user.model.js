import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: false,
            trim: true,
            maxlength: 50
        },

        lastName: {
            type: String,
            trim: true,
            maxlength: 50,
            default: ""
        },

        username: {
            type: String,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 30
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: ["USER", "ADMIN"],
            default: "USER"
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        lastLogin: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

userSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.index(
    { email: 1 },
    {
        unique: true
    }
);

userSchema.index(
    { username: 1 },
    {
        unique: true,
        sparse: true
    }
);

export default mongoose.model("User", userSchema);
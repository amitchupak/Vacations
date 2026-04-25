import bcrypt from "bcrypt";
import { User, IUser } from "../3-models/user";
import { Role } from "../3-models/enums";
import { cyber } from "../2-utils/cyber";
import {
  DuplicateEmailError,
  InvalidCredentialsError,
  ValidationError,
} from "../3-models/errors";

// Handles all "user account" logic: signing up, logging in, and looking users up.
// Password hashing and JWT signing live in `cyber`; this class just talks to the User collection.
class AuthService {

  // Create a brand-new account, hash the password, and return a fresh login token.
  public async register(userData: Partial<IUser>): Promise<{ user: IUser; token: string }> {
    // Make sure all the required fields are there.
    if (!userData.firstName || !userData.lastName || !userData.email || !userData.password) {
      throw new ValidationError("All fields are required");
    }

    // Normalize the email so logins aren't case-sensitive.
    userData.email = userData.email.toLowerCase().trim();

    // Reject if someone already registered with this email.
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new DuplicateEmailError();
    }

    // Never store the raw password — hash it first.
    const hashedPassword = await cyber.hash(userData.password);

    const user = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
      role: Role.User,
    });

    await user.save();

    // Give the user a JWT so they're logged in right away.
    const token = cyber.generateToken(user);
    return { user: user.toObject(), token };
  }

  // Check email + password and return the user (without the password) plus a fresh token.
  // We use the same error for "no such user" and "wrong password" so attackers
  // can't tell which emails exist in our database.
  public async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    // ".select('+password')" is needed because the schema hides password by default.
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.verifyPasswordAgainstStoredHash(user, password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Build the token and strip the password before sending the user back.
    const token = cyber.generateToken(user);
    const userObject = user.toObject();
    delete (userObject as any).password;
    return { user: userObject, token };
  }

  // Check if the password matches what we have stored.
  // We also handle some old/legacy hash formats and quietly upgrade them
  // to the current scheme on the next successful login.
  private async verifyPasswordAgainstStoredHash(
    user: IUser & { _id: unknown; save: () => Promise<unknown> },
    password: string
  ): Promise<boolean> {
    const storedHash = user.password;

    // Current scheme: bcrypt(password + HASH_SALT).
    if (await cyber.compare(password, storedHash)) {
      return true;
    }

    // Old scheme: salt was hardcoded as "default_salt".
    if (await bcrypt.compare(password + "default_salt", storedHash)) {
      user.password = await cyber.hash(password);
      await user.save();
      return true;
    }

    // Older scheme: just bcrypt(password) with no extra salt.
    if (await bcrypt.compare(password, storedHash)) {
      user.password = await cyber.hash(password);
      await user.save();
      return true;
    }

    // Worst case: plain text was stored. Upgrade immediately.
    if (storedHash === password) {
      user.password = await cyber.hash(password);
      await user.save();
      return true;
    }

    return false;
  }

  // Get a user by their id, or null if they don't exist.
  public async getUserById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }
}

// One shared instance used by the controllers.
export const authService = new AuthService();

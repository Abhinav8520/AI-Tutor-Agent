import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Authentication service for handling user authentication operations
 */
export const authService = {
  /**
   * Sign up a new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<UserCredential>} Firebase user credential
   */
  async signUp(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: this._getErrorMessage(error.code) };
    }
  },

  /**
   * Sign in an existing user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<UserCredential>} Firebase user credential
   */
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: this._getErrorMessage(error.code) };
    }
  },

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error) {
      return { error: this._getErrorMessage(error.code) };
    }
  },

  /**
   * Get the current authenticated user
   * @returns {User|null} Current user or null if not authenticated
   */
  getCurrentUser() {
    return auth.currentUser;
  },

  /**
   * Listen to authentication state changes
   * @param {Function} callback - Callback function that receives the user
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChanged(callback) {
    return firebaseOnAuthStateChanged(auth, callback);
  },

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error) {
      return { error: this._getErrorMessage(error.code) };
    }
  },

  /**
   * Convert Firebase error codes to user-friendly messages
   * @param {string} errorCode - Firebase error code
   * @returns {string} User-friendly error message
   */
  _getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'This email is already registered. Please use a different email or sign in.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-email': 'Invalid email format. Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection and try again.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
      'auth/requires-recent-login': 'This operation requires recent authentication. Please sign in again.'
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }
};


import { describe, it, expect, vi } from 'vitest';
import { getSession, logoutUser, registerUser } from '../../controllers/authController.js';
import{ loginUser } from '../../controllers/authController.js';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';


vi.mock('../../models/User.js');
vi.mock('bcryptjs');

 //
const createMockRes = () => { // Helper function to create a mock response object
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.cookie = vi.fn();
    res.clearCookie = vi.fn();
    return res;
};

describe('getSession', () => { // Test suite for the getSession function
    it('returns loggedIn true when session user exists', () => { // Test case for when a user is logged in
        const req = { // Mock request object with a session user
            session: { // Simulate a logged-in user in the session
                user: { // Mock user data
                    id: '123',
                    email: 'test@test.com',
                    firstName: 'John'
                }
            }
        };
        const res = createMockRes(); // Create a mock response object

        getSession(req, res); // Call the function being tested

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            loggedIn: true,
            user: req.session.user
        });
    });

    it('returns loggedIn false when session exists but no user is logged in', () => { // Test case for when the session exists but there is no logged-in user
        const req = { // Mock request object with an empty session user
            session: {}
        };
        const res = createMockRes();

        getSession(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ loggedIn: false });
    });

    it('returns loggedIn false when session does not exist', () => { // Test case for when the session does not exist
        const req = {}; // no session 
        const res = createMockRes();

        getSession(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ loggedIn: false });
    });
});

describe ('longinUser', () => { // test for loginUser function 
    it('returns 400 if validation fails', async () => { // test case for when the input validation fails during login
        const req = {
            body: {
                email: 'invalid',
                password: ''
            },
            session: {}
        };
        const res = createMockRes();
            
        await loginUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ // check that the response contains a message indicating validation failure
                message: 'Validation failed.', 
            })
        );
    });

    it('returns 401 when user is not found', async () => {
        const req = {
            body: {
                email: 'test@test.com',
                password: '123456'
            },
            session: {}
        };
        const res = createMockRes();

        User.findOne.mockResolvedValue(null); // Simulate user not found in the database
        
        await loginUser(req, res);

                expect(User.findOne).toHaveBeenCalledWith({ email: 'test@test.com'});
        expect(res.status).toHaveBeenCalledWith(401);
                expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password.' });
    })

    it('returns 401 when password is incorrect', async () => { // test case for when the provided password does not match the stored password
        const req = {
            body: {
                email: 'test@test.com',
                password: 'wrongpassword'
            },
            session: {}
        };
        const res = createMockRes();

        const user = { // Mock user data returned from the database
            _id:'123',
            email: 'test@test.com',
            passwordHash: 'hashed'
        };

        User.findOne.mockResolvedValue(user); // Simulate user found in the database

        bcrypt.compare.mockResolvedValue(false); // Simulate incorrect password
        
        await loginUser(req, res); 

        expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashed');
        expect(res.status).toHaveBeenCalledWith(401);

        });
    });

    it('logs in user sucessfully', async () => { // test case for successful login with correct credentials
        const req = {
            body: {
                email: 'test@test.com',
                password: '123456'
            },
            session: {}
        };
        const res = createMockRes();

        const user = { // Mock user data returned from the database
            _id: '123',
            firstName: 'John',
            lastname: 'Murphy',
            email: 'test@test.com',
            passwordHash: 'hashedpassword',
            preferredCountry: 'Ireland',
            preferredMonth: 5
        }

        User.findOne.mockResolvedValue(user);

        bcrypt.compare.mockResolvedValue(true); // Simulate correct password

        await loginUser(req, res);

        expect(req.session.user).toEqual({ // Check that the session user is set correctly after successful login
            id: '123',
            email: 'test@test.com',
            firstName: 'John'
        });

        expect(res.cookie).toHaveBeenNthCalledWith( // Check that the preferredCountry cookie is set with the correct value and options
            1,
            'preferredCountry',
            'Ireland',
            expect.any(Object) 
        );

        expect(res.cookie).toHaveBeenCalledWith( // Check that the lastLogin cookie is set with the correct value and options
            'lastLogin',
            expect.any(String),
            expect.any(Object)
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Login successful.'
            })
      );

    });

    it('returns 500 0n server error', async () => { // test case for when there is a server error during the login process
        const req = { // Mock request object with valid email and password
            body: {
                email: 'test@test.com',
                password: '123456'
            },
            session: {}
            };

            const res = createMockRes();

            User.findOne.mockRejectedValue( // Simulate a database error during 
                new Error('Database error')
            );
            await loginUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500); 
            expect(res.json).toHaveBeenCalledWith({ message: 'Server error during login.' });

        });

describe('logoutUser', () => { // test for logoutUser function
    it('returns 200 and clears cookies when logout succeeds', () => {
        const req = {
            session: {
                destroy: vi.fn((callback) => callback(null)) // simulate successful session destruction
            }
        };
        const res = createMockRes();

        logoutUser(req, res);

        expect(req.session.destroy).toHaveBeenCalled(); // Check that the session destroy method was called
        expect(res.clearCookie).toHaveBeenCalledWith('preferredCountry');
        expect(res.clearCookie).toHaveBeenCalledWith('lastLogin');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully.' });
    });

    it('returns 500 when session destroy fails', () => {
        const req = {
            session: {
                destroy: vi.fn((callback) => callback(new Error('destroy failed'))) // simulate failed session destruction
            }
        };
        const res = createMockRes();

        logoutUser(req, res);

        expect(req.session.destroy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Could not log out. Please try again.' });
    });
});

describe('registerUser', () => { // Test suite for the registerUser function
    it('returns 400 when validation fails', async () => { // Test case for validation failures (missing/invalid fields)
        const req = {
            body: {
                firstName: '', // Empty first name
                lastName: 'TestLast',
                email: 'invalidemail', // Invalid email format
                password: '123' // Password too short
            },
            session: {}
        };
        const res = createMockRes();

        await registerUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Validation failed.',
                errors: expect.any(Object) // Errors object with validation messages
            })
        );
    });

    it('returns 409 when email already exists', async () => { // Test case for duplicate email registration
        const req = {
            body: {
                firstName: 'John',
                lastName: 'Murphy',
                email: 'existing@test.com',
                password: '123456',
                phone: '123456789',
                preferredCountry: 'Ireland',
                preferredMonth: 5
            },
            session: {}
        };
        const res = createMockRes();

        // Simulate that email already exists in database
        User.findOne.mockResolvedValue({ id: '999', email: 'existing@test.com' });

        await registerUser(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@test.com' });
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ message: 'An account with this email already exists.' });
    });

    it('returns 500 when password hashing fails', async () => { // Test case for bcrypt hash error
        const req = {
            body: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'newuser@test.com',
                password: '123456',
                phone: '123456789',
                preferredCountry: 'Ireland',
                preferredMonth: 5
            },
            session: {}
        };
        const res = createMockRes();

        
        User.findOne.mockResolvedValue(null);// Email does not exist
        
        bcrypt.hash.mockRejectedValue(new Error('Hashing error'));// Simulate bcrypt hash error

        await registerUser(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Server error during registration.' });
    });

    it('returns 500 when user save fails', async () => { // Test case for database save error
        const req = {
            body: {
                firstName: 'John',
                lastName: 'Murphy',
                email: 'newuser@test.com',
                password: '123456',
                phone: '123456789',
                preferredCountry: 'Ireland',
                preferredMonth: 5
            },
            session: {}
        };
        const res = createMockRes();
        
        User.findOne.mockResolvedValue(null); // Email does not exist
       
        bcrypt.hash.mockResolvedValue('hashedpassword');  // Simulate successful password hashing
        
        
        const mockUserInstance = { // Mock User constructor and save method to throw error
            save: vi.fn().mockRejectedValue(new Error('Database save error'))
        };

        User.mockImplementation(() => mockUserInstance); // Mock the User model to return our mock instance

        await registerUser(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Server error during registration.' });
    });

    it('registers user successfully and sets session and cookie', async () => { // Test case for successful registration
        const req = {
            body: {
                firstName: 'John',
                lastName: 'Murphy',
                email: 'newuser@test.com',
                password: '123456',
                phone: '555-1234',
                preferredCountry: 'France',
                preferredMonth: 7
            },
            session: {}
        };
        const res = createMockRes();

        
        User.findOne.mockResolvedValue(null);// Email does not exist
       
        bcrypt.hash.mockResolvedValue('hashedpassword123'); // Simulate successful password hashing
        
        // Mock saved user response
        const savedUser = {
            _id: 'user123',
            firstName: 'John',
            lastName: 'Murphy',
            email: 'newuser@test.com',
            passwordHash: 'hashedpassword123',
            phone: '555-1234',
            preferredCountry: 'France',
            preferredMonth: 7,
            toObject: vi.fn().mockReturnValue({ // Simulate the toObject method that Mongoose documents have
                _id: 'user123',
                firstName: 'John',
                lastName: 'Murphy',
                email: 'newuser@test.com',
                phone: '555-1234',
                preferredCountry: 'France',
                preferredMonth: 7
            })
        };
        
        const mockUserInstance = {
            save: vi.fn().mockResolvedValue(savedUser) // Simulate successful save of the user to the database
        };

        User.mockImplementation(() => mockUserInstance); // Mock the User model to return our mock instance when instantiated

        await registerUser(req, res);

        // Verify User.findOne was called with lowercase email
        expect(User.findOne).toHaveBeenCalledWith({ email: 'newuser@test.com' });
        
        // Verify password was hashed
        expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
        
        // Verify user was saved
        expect(mockUserInstance.save).toHaveBeenCalled();
        
        // Verify session is set correctly
        expect(req.session.user).toEqual({
            id: 'user123',
            email: 'newuser@test.com',
            firstName: 'John'
        });
        
        // Verify preferredCountry cookie is set
        expect(res.cookie).toHaveBeenCalledWith(
            'preferredCountry',
            'France',
            expect.any(Object)
        );
        
        // Verify success response
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Account created successfully.'
            })
        );
    });

    it('uses default values for optional fields', async () => { // Test case for default values when optional fields are not provided
        const req = {
            body: {
                firstName: 'Michael',
                lastName: 'Delaney',
                email: 'test@test.com',
                password: 'password123'
                // No phone, preferredCountry, or preferredMonth provided
            },
            session: {}
        };
        const res = createMockRes();

        // Email does not exist
        User.findOne.mockResolvedValue(null);
        // Simulate successful password hashing
        bcrypt.hash.mockResolvedValue('hashedpassword456');
        
        // Mock saved user with defaults
        const savedUser = {
            _id: 'user456',
            firstName: 'Michael',
            lastName: 'Delaney',
            email: 'test@test.com',
            passwordHash: 'hashedpassword456',
            preferredCountry: 'Ireland', // Default
            preferredMonth: 1, // Default
            toObject: vi.fn().mockReturnValue({ 
                _id: 'user456',
                firstName: 'Michael',
                lastName: 'Delaney',
                email: 'test@test.com',
                preferredCountry: 'Ireland',
                preferredMonth: 1
            })
        };
        
        const mockUserInstance = {
            save: vi.fn().mockResolvedValue(savedUser)
        };
        User.mockImplementation(() => mockUserInstance);

        await registerUser(req, res);

        // Verify default values are used for preferredCountry cookie
        expect(res.cookie).toHaveBeenCalledWith(
            'preferredCountry',
            'Ireland',
            expect.any(Object)
        );
        
        // Verify success response
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Account created successfully.'
            })
        );
    });
});

    

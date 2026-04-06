import { describe, it, expect, vi } from 'vitest';
import { getSession } from '../../controllers/authController.js';
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
    

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/Suggestion.js', () => ({ // Mock the Suggestion model with necessary methods for testing
    default: {
        find: vi.fn(),
        findById: vi.fn(),
        findByIdAndDelete: vi.fn()
    }
}));

vi.mock('../../models/Holiday.js', () => ({ // Mock the Holiday model, we only need to mock the constructor for the approveSuggestion test
    default: vi.fn()
}));

vi.mock('../../models/User.js', () => ({ // Mock the User model with necessary methods for testing
    default: {
        find: vi.fn(),
        findByIdAndDelete: vi.fn(),
        findByIdAndUpdate: vi.fn()
    }
}));

import { isAdmin, getSuggestions, approveSuggestion, rejectSuggestion, deleteSuggestion, getAllUsers, deleteUser, updateUserRole } from '../../controllers/adminController.js';
import Suggestion from '../../models/Suggestion.js';
import Holiday from '../../models/Holiday.js';
import User from '../../models/User.js';

beforeEach(() => {
    vi.clearAllMocks(); // Clear mock history before each test to ensure tests are independent
});

const createMockRes = () => { // mock function to create a fake response object for testing
    const res = {}; // start with an empty object
    res.status = vi.fn().mockReturnValue(res); // vi.fn creates a fake trackable function, mockReturnValue allows chaining by returning the res object
    res.json = vi.fn().mockReturnValue(res); // mock the json method similarly to allow chaining
    return res; // return fake response object
};

const createMockReq = (data = {}) => ({ // mock function to create a fake request object for testing
    session: { user: { role: 'admin' } }, // default admin
    query: {},
    ...data
});

const createNonAdminReq = (data = {}) => ({
    session: { user: { role: 'user', id: 'user123' } },
    query: {},
    ...data
});

describe('isAdmin', () => { // Tests for access-control helper
    it('returns false and sends 401 when no session user exists', () => {
        const req = { session: {} };
        const res = createMockRes(); // mock response

        const result = isAdmin(req, res); // call function being tested

        expect(result).toBe(false);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'You must be logged in.' });
    });

    it('returns false and sends 403 when user is not admin', () => { // test case for when user exists but is not admin
        const req = { session: { user: { role: 'user' } } };
        const res = createMockRes();

        const result = isAdmin(req, res); // call function being tested

        expect(result).toBe(false);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. Admins only.' });
    });

    it('returns true and does not send a response when user is admin', () => { // test case for when user is admin
        const req = { session: { user: { role: 'admin' } } };
        const res = createMockRes();

        const result = isAdmin(req, res);

        expect(result).toBe(true);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});

describe('getSuggestions', () => {
    it('returns suggestions successfully for admin', async () => {
        const req = createMockReq(); // create mock request with default admin session
        const res = createMockRes(); // create mock response

        const mockSuggestions = [{ name: 'Test Holiday' }]; // mock data to be returned by the database query

        Suggestion.find.mockReturnValue({
            populate: vi.fn().mockReturnValue({
                sort: vi.fn().mockResolvedValue(mockSuggestions)
            })
        });

        await getSuggestions(req, res); 

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ // check that the response contains the expected data
            message: 'Suggestions retrieved successfully.',
            count: 1,
            suggestions: mockSuggestions
        });
    });

    it('returns 400 for invalid status', async () => { // test case for when an invalid status is provided in the query
        const req = createMockReq({
            query: { status: 'invalid' } // set invalid status in query
        });
        const res = createMockRes();

        await getSuggestions(req, res); // call function being tested

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid status. Must be one of: pending, approved, rejected.'
        });
    });

    it('filters suggestions by status', async () => { // test filtering behavior
        const req = createMockReq({
            query: { status: 'pending' }
        });
        const res = createMockRes();

        const mockSuggestions = [{ status: 'pending' }];

        Suggestion.find.mockReturnValue({
            populate: vi.fn().mockReturnValue({
                sort: vi.fn().mockResolvedValue(mockSuggestions)
            })
        });

        await getSuggestions(req, res); // call function being tested

        expect(Suggestion.find).toHaveBeenCalledWith({ status: 'pending' }); // check that the database query was called with the correct filter
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 on server error', async () => { // test case for when the database query throws an error
        const req = createMockReq();
        const res = createMockRes();

        Suggestion.find.mockImplementation(() => {
            throw new Error('Database error'); // simulate a database error
        });

        await getSuggestions(req, res); 

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Server error.' });
    });
});
describe('approveSuggestion', () => { // test for the approveSuggestion function

    it('returns 404 when suggestion is not found', async () => { // test case for non-existent suggestion
        const req = {
            session: { user: { role: 'admin' } },
            params: { suggestionId: '123' } // simulate request with a suggestion ID that does not exist in the database
        };
        const res = createMockRes();

        Suggestion.findById.mockResolvedValue(null); // mock database query to return null, simulating not found

        await approveSuggestion(req, res); 

        expect(Suggestion.findById).toHaveBeenCalledWith('123');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Suggestion not found.' });
    });

    it('returns 400 when suggestion has already been processed', async () => { // test case for already approved/rejected suggestion
        const req = {
            session: { user: { role: 'admin' } },
            params: { suggestionId: '123' }
        };
        const res = createMockRes();

        const existingSuggestion = {
            status: 'approved',
            save: vi.fn()
        };

        Suggestion.findById.mockResolvedValue(existingSuggestion);  // mock database query to return a suggestion that has already been approved

        await approveSuggestion(req, res); 

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Suggestion has already been approved.' });
    });

    it('approves pending suggestion and creates holiday', async () => { // pending suggestion becomes approved and holiday gets created
        const req = {
            session: { user: { role: 'admin' } },
            params: { suggestionId: 'abc123' }
        };
        const res = createMockRes();

        const suggestion = { // mock suggestion data
            _id: 'abc123',
            name: 'Sample Holiday',
            country: 'Canada',
            date: '2026-12-25T00:00:00.000Z',
            category: 'National',
            description: 'Holiday description',
            status: 'pending', 
            save: vi.fn().mockResolvedValue(true) // mock the save method to simulate successful database save
        };

        const holidayInstance = { // fake holiday instance 
            save: vi.fn().mockResolvedValue(true)
        };

        Suggestion.findById.mockResolvedValue(suggestion); // database return the pending suggestion
        Holiday.mockImplementation(function (data) {
            return { ...holidayInstance, ...data };
        }); // mock the Holiday constructor to return our fake instance with the provided data

        await approveSuggestion(req, res); // call function being tested

        expect(suggestion.status).toBe('approved'); 
        expect(suggestion.save).toHaveBeenCalled();
        expect(Holiday).toHaveBeenCalledWith({
            name: 'Sample Holiday',
            country: 'Canada',
            date: '2026-12-25T00:00:00.000Z',
            month: 12, // check that the month was correctly calculated from the date
            category: 'National',
            description: 'Holiday description'
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ // check important parts of the response without needing to match the entire object
                message: 'Suggestion approved and added to holidays.',
                suggestion // check that the response contains the approved suggestion data
            })
        );
    });

    it('returns 400 when suggestion ID is invalid', async () => { // CastError path
        const req = {
            session: { user: { role: 'admin' } },
            params: { suggestionId: 'invalid-id' }
        };
        const res = createMockRes();

        const castError = new Error('Invalid ObjectId'); // simulate MongoDB error
        castError.name = 'CastError';
        Suggestion.findById.mockRejectedValue(castError); //database throws error instead of returning a suggestion

        await approveSuggestion(req, res); 

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid suggestion ID.' });
    });

    it('returns 500 on unexpected error', async () => { // generic server error path
        const req = {
            session: { user: { role: 'admin' } },
            params: { suggestionId: '123' }
        };
        const res = createMockRes();

        Suggestion.findById.mockRejectedValue(new Error('Database down'));

        await approveSuggestion(req, res); // call function being tested

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Server error.' });
    });
});

describe('rejectSuggestion', () => { // test for the rejectSuggestion function 

    it('returns 404 when suggestion is not found', async () => { // test case for non-existent suggestion
        const req = {
            session: { user: { role: 'admin' } },
            params: { suggestionId: '123' }
        };
        const res = createMockRes();

        Suggestion.findById.mockResolvedValue(null); // mock database query to return null, simulating not found

        await rejectSuggestion(req, res); 

        expect(Suggestion.findById).toHaveBeenCalledWith('123');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Suggestion not found.' });
    });

    it('returns 400 when suggestion has already been processed', async () => { // test case for already approved/rejected suggestion
        const req = {
            session: { user: { role: 'admin' } },
            params: { suggestionId: '123' }
        };
        const res = createMockRes();

        const existingSuggestion = { // mock suggestion that has already been approved
            status: 'approved',
            save: vi.fn()
        };

        Suggestion.findById.mockResolvedValue(existingSuggestion); // mock database query to return a suggestion that has already been approved

        await rejectSuggestion(req, res); 

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Suggestion has already been approved.' });
    });

    it('rejects pending suggestion successfully', async () => { // pending suggestion becomes rejected
        const req = {
            session: { user: { role: 'admin' } },
            params: { suggestionId: 'abc123' }
        };
        const res = createMockRes();

        const suggestion = { // mock suggestion data
            _id: 'abc123',
            name: 'Sample Holiday',
            status: 'pending',
            save: vi.fn().mockResolvedValue(true)
        };

        Suggestion.findById.mockResolvedValue(suggestion); // database returns pending suggestion

        await rejectSuggestion(req, res); // call function being tested

        expect(suggestion.status).toBe('rejected');
        expect(suggestion.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Suggestion rejected.',
            suggestion
        });
    });

    it('returns 400 when suggestion ID is invalid', async () => { // CastError path
        const req = {
            session: { user: { role: 'admin' } },
            params: { suggestionId: 'invalid-id' }
        };
        const res = createMockRes();

        const castError = new Error('Invalid ObjectId');  // simulate MongoDB CastError
        castError.name = 'CastError';
        Suggestion.findById.mockRejectedValue(castError);

        await rejectSuggestion(req, res); 

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid suggestion ID.' });
    });

    it('returns 500 on unexpected error', async () => { // generic server error path
        const req = {
            session: { user: { role: 'admin' } },
            params: { suggestionId: '123' }
        };
        const res = createMockRes();

        Suggestion.findById.mockRejectedValue(new Error('Database down'));

        await rejectSuggestion(req, res); 

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Server error.' });
    });
});

describe('deleteSuggestion', () => { //test for the deleteSuggestion function
    it('returns 404 when suggestion is not found', async () => {
        const req = {
            session: { user: { role: 'admin'}},
            params: { suggestionId: '123'}
        };
        const res = createMockRes();
        
        Suggestion.findByIdAndDelete.mockResolvedValue(null); // mock database query to return null, simulating not found

        await deleteSuggestion(req, res);

        expect(Suggestion.findByIdAndDelete).toHaveBeenCalledWith('123');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Suggestion not found.' });
    });

    it('deletes suggestion successfully', async () => {
        const req = {
            session: { user: { role: 'admin'}},
            params: { suggestionId: '123'}
        };
        const res = createMockRes();
        const deletedSuggestion = { _id: '123'};

        Suggestion.findByIdAndDelete.mockResolvedValue(deletedSuggestion); // mock database query to return the deleted suggestion

        await deleteSuggestion(req, res);

        expect(Suggestion.findByIdAndDelete).toHaveBeenCalledWith('123');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Suggestion deleted successfully.' });

    });

    it('returns 400 when suggestion ID is invalid', async () => {
        const req = {
            session: { user: { role: 'admin' } },
            params: { suggestionId: 'invalid-id' }
        };
        const res = createMockRes();

        const castError = new Error('Invalid ID'); // simulate MongoDB CastError
        castError.name = 'CastError';

        Suggestion.findByIdAndDelete.mockRejectedValue(castError); // mock database query to throw CastError

        await deleteSuggestion(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid suggestion ID.' });
    });
    
    it('returns 500 on unexpected error', async () => {
        const req = {
            session: { user: { role: 'admin' } },
            params: { suggestionId: '123' }
        };
        const res = createMockRes();

        Suggestion.findByIdAndDelete.mockRejectedValue(new Error('Database down')); // mock database query to throw generic error

        await deleteSuggestion(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Server error.' });
    
    });
});

describe('getAllUsers', () => { // test for the getAllUsers function
    it('returns all users successfully', async () => {
        const req = {
            session: { user: { role: 'admin' } }
        };
        const res = createMockRes();

        const mockUsers = [
            { firstName: 'John', email:'john@test.com'},
            { firstName: 'Jane', email:'jane@test.com'}                   
        ];
        const sortMock = vi.fn().mockResolvedValue(mockUsers);
        const selectMock = vi.fn().mockReturnValue({ sort: sortMock });
        User.find.mockReturnValue({ select: selectMock });

        await getAllUsers(req, res);

        expect(User.find).toHaveBeenCalledWith({}); // check that the database query was called with the correct parameters
        expect(selectMock).toHaveBeenCalledWith('-passwordHash'); // check that the passwordHash field was excluded from the query results
        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 }); // check that the results were sorted by creation date in descending order
        expect(res.status).toHaveBeenCalledWith(200); 
        expect(res.json).toHaveBeenCalledWith({
            message: 'Users retrieved successfully.',
            count: 2, // check that the response contains the correct count of users
            users: mockUsers 
        });
    });

    it('returns 500 if database query fails', async () => {
        const req = {
            session: { user: { role: 'admin' } }
        };
        const res = createMockRes();

        User.find.mockImplementation(() => {
            throw new Error('Database error'); // simulate database error
        });

        await getAllUsers(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Server error.' });
    });
});

describe('deleteUser', () => { // tests for deleteUser controller
    it('returns 400 when admin tries to delete own account', async () => {
        const req = {
            session: { user: { role: 'admin', id: 'admin123' } },
            params: { userId: 'admin123' }
        };
        const res = createMockRes();

        await deleteUser(req, res); // call function being tested

        expect(User.findByIdAndDelete).not.toHaveBeenCalled(); // check that the database query was not called since the controller should have returned early
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'You cannot delete your own admin account.' });
    });

    it('returns 404 when user is not found', async () => {
        const req = {
            session: { user: { role: 'admin', id: 'admin123' } },
            params: { userId: 'user456' }
        };
        const res = createMockRes();

        User.findByIdAndDelete.mockResolvedValue(null); // simulate no user found

        await deleteUser(req, res); // call function being tested

        expect(User.findByIdAndDelete).toHaveBeenCalledWith('user456');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
    });

    it('deletes another user successfully', async () => {
        const req = {
            session: { user: { role: 'admin', id: 'admin123' } },
            params: { userId: 'user456' }
        };
        const res = createMockRes();

        User.findByIdAndDelete.mockResolvedValue({ _id: 'user456' }); // simulate successful deletion of the user

        await deleteUser(req, res); 

        expect(User.findByIdAndDelete).toHaveBeenCalledWith('user456');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully.' });
    });

    it('returns 400 for invalid user ID', async () => {
        const req = {
            session: { user: { role: 'admin', id: 'admin123' } },
            params: { userId: 'invalid-id' }
        };
        const res = createMockRes();

        const castError = new Error('Invalid ObjectId');
        castError.name = 'CastError';
        User.findByIdAndDelete.mockRejectedValue(castError); // simulate database throwing a CastError when trying to delete with an invalid ID

        await deleteUser(req, res); // call function being tested

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid user ID.' });
    });

    it('returns 500 on unexpected error', async () => {
        const req = {
            session: { user: { role: 'admin', id: 'admin123' } },
            params: { userId: 'user456' }
        };
        const res = createMockRes();

        User.findByIdAndDelete.mockRejectedValue(new Error('Database down')); 

        await deleteUser(req, res); 

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Server error.' });
    });
});

describe('updateUserRole', () => { // tests for updateUserRole controller
    it('returns 400 when role is missing', async () => {
        const req = {
            session: { user: { role: 'admin', id: 'admin123' } },
            params: { userId: 'user456' },
            body: {}
        };
        const res = createMockRes();

        await updateUserRole(req, res); // early validation should fail before hitting DB

        expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid role. Must be one of: user, admin.'
        });
    });

    it('returns 400 when role is invalid', async () => {
        const req = {
            session: { user: { role: 'admin', id: 'admin123' } },
            params: { userId: 'user456' },
            body: { role: 'manager' }
        };
        const res = createMockRes();

        await updateUserRole(req, res); // invalid role should be rejected by controller validation

        expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid role. Must be one of: user, admin.'
        });
    });

    it('returns 404 when user is not found', async () => {
        const req = {
            session: { user: { role: 'admin', id: 'admin123' } },
            params: { userId: 'user456' },
            body: { role: 'admin' }
        };
        const res = createMockRes();

        User.findByIdAndUpdate.mockReturnValue({ // Mongoose chain: findByIdAndUpdate(...).select(...)
            
            select: vi.fn().mockResolvedValue(null)
        });

        await updateUserRole(req, res); // call function being tested

        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            'user456',
            { role: 'admin' },
            { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
    });

    it('updates user role successfully', async () => {
        const req = {
            session: { user: { role: 'admin', id: 'admin123' } },
            params: { userId: 'user456' },
            body: { role: 'admin' }
        };
        const res = createMockRes();

        const updatedUser = {
            _id: 'user456',
            firstName: 'Jane',
            role: 'admin'
        };

        User.findByIdAndUpdate.mockReturnValue({// Return the updated user document after select('-passwordHash')
            
            select: vi.fn().mockResolvedValue(updatedUser)
        });

        await updateUserRole(req, res); // call function being tested

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "User role updated to 'admin'.",
            user: updatedUser
        });
    });

    it('returns 400 for invalid user ID', async () => {
        const req = {
            session: { user: { role: 'admin', id: 'admin123' } },
            params: { userId: 'invalid-id' },
            body: { role: 'user' }
        };
        const res = createMockRes();

        const castError = new Error('Invalid ObjectId');
        castError.name = 'CastError';
        User.findByIdAndUpdate.mockReturnValue({ // Simulate cast failure during query execution
           
            select: vi.fn().mockRejectedValue(castError)
        });

        await updateUserRole(req, res); // call function being tested

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid user ID.' });
    });

    it('returns 500 on unexpected error', async () => {
        const req = {
            session: { user: { role: 'admin', id: 'admin123' } },
            params: { userId: 'user456' },
            body: { role: 'user' }
        };
        const res = createMockRes();

        User.findByIdAndUpdate.mockReturnValue({// Generic failure path not handled by CastError branch
           
            select: vi.fn().mockRejectedValue(new Error('Database down'))
        });

        await updateUserRole(req, res); 

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Server error.' });
    });
});

describe('admin access guard on handlers', () => { // tests to ensure that non-admin users are blocked from accessing admin routes
    it('blocks non-admin access to getSuggestions', async () => {
        const req = createNonAdminReq();
        const res = createMockRes();

        await getSuggestions(req, res);

        expect(Suggestion.find).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. Admins only.' });
    });

    it('blocks non-admin access to approveSuggestion', async () => {
        const req = createNonAdminReq({ params: { suggestionId: 's1' } });
        const res = createMockRes();

        await approveSuggestion(req, res);

        expect(Suggestion.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('blocks non-admin access to rejectSuggestion', async () => {
        const req = createNonAdminReq({ params: { suggestionId: 's1' } });
        const res = createMockRes();

        await rejectSuggestion(req, res);

        expect(Suggestion.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('blocks non-admin access to deleteSuggestion', async () => {
        const req = createNonAdminReq({ params: { suggestionId: 's1' } });
        const res = createMockRes();

        await deleteSuggestion(req, res);

        expect(Suggestion.findByIdAndDelete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('blocks non-admin access to getAllUsers', async () => {
        const req = createNonAdminReq();
        const res = createMockRes();

        await getAllUsers(req, res);

        expect(User.find).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('blocks non-admin access to deleteUser', async () => {
        const req = createNonAdminReq({ params: { userId: 'u1' } });
        const res = createMockRes();

        await deleteUser(req, res);

        expect(User.findByIdAndDelete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('blocks non-admin access to updateUserRole', async () => {
        const req = createNonAdminReq({ params: { userId: 'u1' }, body: { role: 'admin' } });
        const res = createMockRes();

        await updateUserRole(req, res);

        expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. Admins only.' });
    });
});






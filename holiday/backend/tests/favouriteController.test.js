import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addSavedHoliday, getSavedHolidays, deleteSavedHoliday } from '../controllers/favouriteController.js';
import Favourite from '../models/Favourite.js';
import Holiday from '../models/Holiday.js';

vi.mock('../models/Favourite.js');
vi.mock('../models/Holiday.js');

const createMockRes = () => { 
	const res = {};
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res;
};

beforeEach(() => { // Clear all mocks before each test to ensure test isolation
	vi.clearAllMocks();
});

describe('addSavedHoliday', () => { // Test for saving a holiday to favourites
	it('returns 401 when the user is not logged in', async () => { // Test case for missing session user
		const req = {
			session: {},
			body: { holidayId: 'holiday123' }
		};
		const res = createMockRes();

		await addSavedHoliday(req, res);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: 'You must be logged in to save a holiday.'
		});
	});

	it('returns 400 when holidayId is missing', async () => { // Test case for validation failure
		const req = {
			session: { user: { id: 'user123' } },
			body: {}
		};
		const res = createMockRes();

		await addSavedHoliday(req, res);

		expect(Holiday.findById).not.toHaveBeenCalled(); // The database should not be queried if validation fails
		expect(Favourite.create).not.toHaveBeenCalled(); // No attempt to save should be made if validation fails
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Validation failed.',
			errors: { holidayId: 'Holiday ID is required.' }
		});
	});

	it('returns 404 when the holiday does not exist', async () => { // Test case for a holiday that does not exist in the database
		const req = {
			session: { user: { id: 'user123' } },
			body: { holidayId: 'holiday123' }
		};
		const res = createMockRes();

		Holiday.findById = vi.fn().mockResolvedValue(null); // simulate holiday not found

		await addSavedHoliday(req, res);

		expect(Holiday.findById).toHaveBeenCalledWith('holiday123'); //check if holiday exists in the database
		expect(Favourite.create).not.toHaveBeenCalled(); // No attempt to save should be made if the holiday does not exist
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Holiday not found.'
		});
	});

	it('returns 201 and saves the holiday successfully', async () => { // Test case for a successfull holiday save
		const req = {
			session: { user: { id: 'user123' } },
			body: { holidayId: 'holiday123' }
		};
		const res = createMockRes();

		const savedHoliday = { // mock saved holiday 
			_id: 'saved123',
			user: 'user123',
			holiday: 'holiday123',
			populate: vi.fn().mockResolvedValue(undefined) 
		};

		Holiday.findById = vi.fn().mockResolvedValue({ _id: 'holiday123' }); // simulate holiday exists
		Favourite.create = vi.fn().mockResolvedValue(savedHoliday); // simulate successful save

		await addSavedHoliday(req, res);

		expect(Holiday.findById).toHaveBeenCalledWith('holiday123');
		expect(Favourite.create).toHaveBeenCalledWith({ // Check that the save is attempted with the correct user and holiday IDs
			user: 'user123',
			holiday: 'holiday123'
		});
		expect(savedHoliday.populate).toHaveBeenCalledWith('holiday'); // Check that the holiday details are populated before returning
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Holiday saved to favourites.',
			savedHoliday
		});
	});

	it('returns 409 when the holiday is already in favourites', async () => { // Test case for duplicate save attempt
		const req = {
			session: { user: { id: 'user123' } },
			body: { holidayId: 'holiday123' }
		};
		const res = createMockRes();

		Holiday.findById = vi.fn().mockResolvedValue({ _id: 'holiday123' });
		Favourite.create = vi.fn().mockRejectedValue({ code: 11000 }); // simulate duplicate key error from MongoDB

		await addSavedHoliday(req, res);

		expect(res.status).toHaveBeenCalledWith(409);
		expect(res.json).toHaveBeenCalledWith({
			message: 'This holiday is already in your favourites.'
		});
	});

	it('returns 400 when the holiday ID is invalid', async () => { // Test case for invalid MongoDB ID
		const req = {
			session: { user: { id: 'user123' } },
			body: { holidayId: 'invalid-id' } // This should trigger a CastError when the controller tries to find the holiday by ID
		};
		const res = createMockRes();

		const castError = new Error('CastError'); // Simulate a CastError thrown by Mongoose when an invalid ID is used
		castError.name = 'CastError'; // Set the name property to identify it as a CastError

		Holiday.findById = vi.fn().mockRejectedValue(castError); // simulate database throwing a CastError

		await addSavedHoliday(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Invalid holiday ID.'
		});
	});

	it('returns 500 when the database throws an unexpected error', async () => { // Test case for a generic server error
		const req = {
			session: { user: { id: 'user123' } },
			body: { holidayId: 'holiday123' }
		};
		const res = createMockRes();

		Holiday.findById = vi.fn().mockRejectedValue(new Error('Database error'));

		await addSavedHoliday(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Server error.'
		});
	});
});

describe('getSavedHolidays', () => { // Test for retrieving user's saved holidays
	it('returns 401 when the user is not logged in', async () => { // Test case for missing session user
		const req = {
			session: {}
		};
		const res = createMockRes();

		await getSavedHolidays(req, res);

		expect(Favourite.find).not.toHaveBeenCalled(); // Database should not be queried if user is not logged in
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: 'You must be logged in to view your saved holidays.'
		});
	});

	it('returns 200 with empty array when user has no saved holidays', async () => { // Test case for user with no favorites
		const req = {
			session: { user: { id: 'user123' } }
		};
		const res = createMockRes();

		const findChain = { // Mock the chainable query to return an empty array, simulating a user with no saved holidays
			populate: vi.fn().mockReturnValue({
				sort: vi.fn().mockResolvedValue([])
			})
		};

		Favourite.find = vi.fn().mockReturnValue(findChain);

		await getSavedHolidays(req, res);

		expect(Favourite.find).toHaveBeenCalledWith({ user: 'user123' }); // Verify query filters by user ID
		expect(findChain.populate).toHaveBeenCalledWith('holiday'); // Verify holiday details are populated
		expect(findChain.populate('holiday').sort).toHaveBeenCalledWith({ createdAt: -1 }); // Verify sorting by most recent first
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Saved holidays retrieved successfully.',
			count: 0,
			savedHolidays: []
		});
	});

	it('returns 200 with saved holidays when user has favourites', async () => { // Test case for successful retrieval of multiple saved holidays
		const req = {
			session: { user: { id: 'user123' } }
		};
		const res = createMockRes();

		const mockSavedHolidays = [ // Mock data for saved holidays, simulating a user with 3 saved holidays
			{
				_id: 'saved1',
				user: 'user123',
				holiday: { _id: 'holiday1', name: 'Paris', country: 'France' },
				createdAt: new Date('2024-04-08')
			},
			{
				_id: 'saved2',
				user: 'user123',
				holiday: { _id: 'holiday2', name: 'Barcelona', country: 'Spain' },
				createdAt: new Date('2024-04-07')
			},
			{
				_id: 'saved3',
				user: 'user123',
				holiday: { _id: 'holiday3', name: 'Dublin', country: 'Ireland' },
				createdAt: new Date('2024-04-06')
			}
		];

		const findChain = { // Mock successful query returning saved holidays
			populate: vi.fn().mockReturnValue({
				sort: vi.fn().mockResolvedValue(mockSavedHolidays)
			})
		};

		Favourite.find = vi.fn().mockReturnValue(findChain); 

		await getSavedHolidays(req, res);

		expect(Favourite.find).toHaveBeenCalledWith({ user: 'user123' });
		expect(findChain.populate).toHaveBeenCalledWith('holiday');
		expect(findChain.populate('holiday').sort).toHaveBeenCalledWith({ createdAt: -1 });
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Saved holidays retrieved successfully.',
			count: 3,
			savedHolidays: mockSavedHolidays
		});
	});

	it('returns 500 when database query fails', async () => { // Test case for server error during retrieval
		const req = {
			session: { user: { id: 'user123' } }
		};
		const res = createMockRes();

		const findChain = {
			populate: vi.fn().mockReturnValue({
				sort: vi.fn().mockRejectedValue(new Error('Database connection failed'))
			})
		};

		Favourite.find = vi.fn().mockReturnValue(findChain);

		await getSavedHolidays(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Server error.'
		});
	});
});

describe('deleteSavedHoliday', () => { // Test for removing a holiday from favourites
	it('returns 401 when the user is not logged in', async () => { // Test case for missing session user
		const req = {
			session: {},
			params: { savedId: 'saved123' }
		};
		const res = createMockRes();

		await deleteSavedHoliday(req, res);

		expect(Favourite.findOneAndDelete).not.toHaveBeenCalled(); // Database should not be queried if user is not logged in
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: 'You must be logged in to remove a saved holiday.'
		});
	});

	it('returns 404 when saved holiday is not found', async () => { // Test case for missing or non-owned saved holiday
		const req = {
			session: { user: { id: 'user123' } },
			params: { savedId: 'saved-not-found' }
		};
		const res = createMockRes();

		Favourite.findOneAndDelete = vi.fn().mockResolvedValue(null); // Simulate not found or not owned by user

		await deleteSavedHoliday(req, res);

		expect(Favourite.findOneAndDelete).toHaveBeenCalledWith({
			_id: 'saved-not-found',
			user: 'user123'
		}); // Verify query filters by both ID and user
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Saved holiday not found.'
		});
	});

	it('returns 200 when saved holiday is successfully deleted', async () => { // Test case for successful removal
		const req = {
			session: { user: { id: 'user123' } },
			params: { savedId: 'saved123' }
		};
		const res = createMockRes();

		const deletedHoliday = { // mock deleted saved holiday 
			_id: 'saved123',
			user: 'user123',
			holiday: 'holiday123',
			createdAt: new Date('2024-04-08')
		};

		Favourite.findOneAndDelete = vi.fn().mockResolvedValue(deletedHoliday); // Simulate successful deletion

		await deleteSavedHoliday(req, res);

		expect(Favourite.findOneAndDelete).toHaveBeenCalledWith({
			_id: 'saved123',
			user: 'user123'
		});
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Holiday removed from favourites.'
		});
	});

	it('returns 400 when saved holiday ID format is invalid (CastError)', async () => { // Test case for invalid MongoDB ObjectId format
		const req = {
			session: { user: { id: 'user123' } },
			params: { savedId: 'invalid-id-format' }
		};
		const res = createMockRes();

		const castError = new Error('Invalid ObjectId'); // Simulate Mongoose CastError for invalid ID format
		castError.name = 'CastError';

		Favourite.findOneAndDelete = vi.fn().mockRejectedValue(castError); // Simulate database throwing a CastError when trying to delete with an invalid ID

		await deleteSavedHoliday(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Invalid saved holiday ID.'
		});
	});

	it('returns 500 when database delete operation fails', async () => { // Test case for server error during deletion
		const req = {
			session: { user: { id: 'user123' } },
			params: { savedId: 'saved123' }
		};
		const res = createMockRes();

		Favourite.findOneAndDelete = vi.fn().mockRejectedValue(new Error('Database connection failed'));

		await deleteSavedHoliday(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Server error.'
		});
	});
});

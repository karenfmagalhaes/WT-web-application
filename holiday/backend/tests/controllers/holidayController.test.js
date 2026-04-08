import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHolidays } from '../../controllers/holidayController.js';
import Holiday from '../../models/Holiday.js';

vi.mock('../../models/Holiday.js');

const createMockRes = () => {
	// Chainable Express response mock: res.status(...).json(...)
	const res = {};
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res;
};

beforeEach(() => {
	// Reset all spies/mocks between test cases
	vi.clearAllMocks();
});

describe('getHolidays', () => { // Test for the getHolidays controller function
	it('returns all holidays when no filters are provided', async () => {
		const req = { query: {} };
		const res = createMockRes();
		const next = vi.fn();

		const mockHolidays = [ // mock holiday data 
			{ _id: 'h1', name: 'New Year', country: 'Ireland', month: 1 },
			{ _id: 'h2', name: 'Christmas', country: 'Ireland', month: 12 },
		];

		const sortMock = vi.fn().mockResolvedValue(mockHolidays); // Mock the sort function to return the mock holidays
		Holiday.find = vi.fn().mockReturnValue({ sort: sortMock }); // Mock the find function to return an object with a sort method that returns the mock holidays

		await getHolidays(req, res, next);

		expect(Holiday.find).toHaveBeenCalledWith({});
		expect(sortMock).toHaveBeenCalledWith({ month: 1, date: 1, name: 1 });
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Holidays retrieved successfully.',
			count: 2,
			holidays: mockHolidays,
		});
		expect(next).not.toHaveBeenCalled(); // next should not be called if there are no errors
	});

	it('applies country filter as case-insensitive exact match', async () => { // Test that the country filter is applied correctly as a case-insensitive exact match
		const req = { query: { country: 'Ireland' } };
		const res = createMockRes();
		const next = vi.fn();

		const sortMock = vi.fn().mockResolvedValue([]);
		Holiday.find = vi.fn().mockReturnValue({ sort: sortMock });

		await getHolidays(req, res, next);

		expect(Holiday.find).toHaveBeenCalledWith({
			country: new RegExp('^Ireland$', 'i'),
		});
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Holidays retrieved successfully.',
			count: 0,
			holidays: [],
		});
	});

	it('applies month, category, and search filters together', async () => {
		const req = { // Controller should cast month to number and build a regex search on name
			query: { month: '12', category: 'Public', search: 'christ' },
		};
		const res = createMockRes();
		const next = vi.fn();

		const mockHolidays = [
			{ _id: 'h2', name: 'Christmas Day', country: 'Ireland', month: 12, category: 'Public' },
		];

		const sortMock = vi.fn().mockResolvedValue(mockHolidays);
		Holiday.find = vi.fn().mockReturnValue({ sort: sortMock }); 

		await getHolidays(req, res, next);

		expect(Holiday.find).toHaveBeenCalledWith({
			month: 12,
			category: 'Public',
			name: { $regex: 'christ', $options: 'i' },
		});
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Holidays retrieved successfully.',
			count: 1,
			holidays: mockHolidays,
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('returns 400 when month is outside valid range', async () => { // test for when user inputs invalid month 
		const req = { query: { month: '13' } };
		const res = createMockRes();
		const next = vi.fn();

		await getHolidays(req, res, next);

		// Invalid month should short-circuit before any DB query
		expect(Holiday.find).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Month must be a number between 1 and 12.',
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('returns 400 when category is invalid', async () => { // test for when user inputs invalid category
		const req = { query: { category: 'InvalidType' } };
		const res = createMockRes();
		const next = vi.fn();

		await getHolidays(req, res, next);

		expect(Holiday.find).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: expect.stringContaining('Invalid category. Must be one of:'),
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('calls next(error) when database query fails', async () => { // test that if the database query throws an unexpected error, it is passed to the next error-handling middleware
		const req = { query: {} };
		const res = createMockRes();
		const next = vi.fn();

		// In this controller, unexpected errors are delegated to Express error middleware
		const dbError = new Error('Database error');
		const sortMock = vi.fn().mockRejectedValue(dbError);
		Holiday.find = vi.fn().mockReturnValue({ sort: sortMock });

		await getHolidays(req, res, next);

		expect(next).toHaveBeenCalledWith(dbError);
		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
	});
});

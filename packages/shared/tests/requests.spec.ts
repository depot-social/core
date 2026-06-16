/// <reference types="vitest" />
import { assert, test, describe } from 'vitest';
import { Parameters, getFilters, getFields, getPagination } from '../requests';

describe('getFilters', () => {
    test('should return an empty array if no filters are provided', () => {
        const params: Parameters = { filters: null };
        const result = getFilters(params);
        assert.deepEqual(result, []);
    });

    test('should return an array of filter strings when filters are provided', () => {
        const params: Parameters = {
            filters: {
                name: { operator: '$eq', value: 'John' },
                age: { operator: 'gte', value: 18 },
            },
        };
        const result = getFilters(params);
        assert.deepEqual(result, [
            'filters[$or][0][name][$eq]=John',
            'filters[$or][1][age][gte]=18',
        ]);
    });

    test('should use $and instead of $or when specified in the filter', () => {
        const params: Parameters = {
            filters: {
                name: { operator: '$eq', value: 'John', join: '$and' },
                age: { operator: 'gte', value: 18, join: '$and' },
            },
        };
        const result = getFilters(params);
        assert.deepEqual(result, [
            'filters[$and][0][name][$eq]=John',
            'filters[$and][1][age][gte]=18',
        ]);
    });

    test('should handle nested filter keys', () => {
        const params: Parameters = {
            filters: {
                'user.name': { operator: '$eq', value: 'John' },
                'user.age': { operator: 'gte', value: 18 },
            },
        };
        const result = getFilters(params);
        assert.deepEqual(result, [
            'filters[$or][0][user][name][$eq]=John',
            'filters[$or][1][user][age][gte]=18',
        ]);
    });

    test('should handle empty filter values', () => {
        const params: Parameters = {
            filters: {
                name: { operator: '$eq', value: '' },
                age: { operator: 'gte', value: null },
            },
        };
        const result = getFilters(params);
        assert.deepEqual(result, [
            'filters[$or][0][name][$eq]=',
            'filters[$or][1][age][gte]=null',
        ]);
    });

    test('should handle nested and combined filter values', () => {
        const params: Parameters = {
            filters: {
                title: { operator: '$eq', value: 'lorem' },
                description: { operator: '$eq', value: 'lorem' },
                "categories.id": { operator: '$contains', value: 101, join: '$and' }
            },
        };
        const result = getFilters(params);
        assert.deepEqual(result, [
            'filters[$or][0][title][$eq]=lorem',
            'filters[$or][1][description][$eq]=lorem',
            'filters[$and][0][categories][id][$contains]=101'
        ]);
    });
})

describe('getFields', () => {
    test('should return empty array if no fields provided', () => {
        const params: Parameters = {
            fields: undefined
        };
        const result = getFields(params);
        assert.deepEqual(result, []);
    });

    test('should return mapped field array if fields provided', () => {
        const params: Parameters = {
            fields: ['title', 'description']
        };
        const result = getFields(params);
        assert.deepEqual(result, [
            'fields[0]=title',
            'fields[1]=description'
        ])
    });
});

describe('getPagination', () => {
    test('should return an empty array if no pagination parameters are provided', () => {
        const params = {};
        const result = getPagination(params);
        assert.deepEqual(result, []);
    });

    test('should return an array with the page parameter if it is provided', () => {
        const params: Parameters = { pagination: { page: 2 } };
        const result = getPagination(params);
        assert.deepEqual(result, ['pagination[page]=2']);
    });

    test('should return an array with the pageSize parameter if it is provided', () => {
        const params: Parameters = { pagination: { pageSize: 10 } };
        const result = getPagination(params);
        assert.deepEqual(result, ['pagination[pageSize]=10']);
    });

    test('should return an array with both page and pageSize parameters if they are provided', () => {
        const params: Parameters = { pagination: { page: 2, pageSize: 10 } };
        const result = getPagination(params);
        assert.deepEqual(result, ['pagination[page]=2', 'pagination[pageSize]=10']);
    });

    test('should return an empty array if the pagination parameter is null', () => {
        const params: Parameters = { pagination: null };
        const result = getPagination(params);
        assert.deepEqual(result, []);
    });

    test('should return an empty array if the pagination parameter is undefined', () => {
        const params: Parameters = { pagination: undefined };
        const result = getPagination(params);
        assert.deepEqual(result, []);
    });
})

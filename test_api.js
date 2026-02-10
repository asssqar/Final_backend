const BASE_URL = 'http://127.0.0.1:5000/api';

async function test() {
    console.log('--- Starting Tests ---');

    // 1. Register Admin
    console.log('\n1. Registering Admin...');
    let res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'adminUser',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin'
        })
    });
    let data = await res.json();
    console.log('Admin Register Status:', res.status);
    const adminToken = data.token;

    if (!adminToken && res.status !== 201) {
        console.log('Admin probably exists, logging in...');
        res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password123'
            })
        });
        data = await res.json();
        console.log('Admin Login Status:', res.status);
    }
    const finalAdminToken = data.token;
    console.log('Admin Token obtained:', !!finalAdminToken);


    // 2. Register Normal User
    console.log('\n2. Registering Normal User...');
    res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'normalUser',
            email: 'user@example.com',
            password: 'password123',
            role: 'user'
        })
    });
    data = await res.json();
    console.log('User Register Status:', res.status);

    if (!data.token && res.status !== 201) {
        console.log('User probably exists, logging in...');
        res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'user@example.com',
                password: 'password123'
            })
        });
        data = await res.json();
    }
    const userToken = data.token;
    console.log('User Token obtained:', !!userToken);

    // 3. Create Book as Admin
    console.log('\n3. Create Book (Admin)...');
    res = await fetch(`${BASE_URL}/books`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${finalAdminToken}`
        },
        body: JSON.stringify({
            title: 'Test Book',
            author: 'Test Author',
            description: 'A book for testing'
        })
    });
    data = await res.json();
    console.log('Create Book Status:', res.status, data.success ? 'Success' : 'Fail');
    const bookId = data.data ? data.data._id : null;

    // 4. Create Book as User (Should Fail)
    console.log('\n4. Create Book (User) - Should Fail...');
    res = await fetch(`${BASE_URL}/books`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
            title: 'User Book',
            author: 'User Author'
        })
    });
    console.log('Create Book (User) Status:', res.status, 'Expeted 403');

    if (bookId) {
        // 5. Create Review as User
        console.log('\n5. Create Review (User)...');
        res = await fetch(`${BASE_URL}/books/${bookId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                text: 'Great book!',
                rating: 5
            })
        });
        data = await res.json();
        console.log('Create Review Status:', res.status);

        // 6. Get Reviews
        console.log('\n6. Get Reviews...');
        res = await fetch(`${BASE_URL}/books/${bookId}/reviews`);
        data = await res.json();
        console.log('Get Reviews Status:', res.status);
        console.log('Reviews count:', data.count);
    }

    console.log('\n--- Tests Completed ---');
}

test();

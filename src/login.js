import { supabase } from './supabaseClient.js';

const USERS = {
    'demo': 'demo123',
    'admin': 'admin123',
    'hackathon': 'outskill2024'
};

async function createOrGetUser(username, password) {
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

    if (!existingUser) {
        const { data, error } = await supabase
            .from('users')
            .insert([{
                username: username,
                password_hash: password
            }])
            .select();

        if (error) {
            console.error('Error creating user:', error);
        }
    }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    if (USERS[username] && USERS[username] === password) {
        await createOrGetUser(username, password);

        localStorage.setItem('loggedIn', 'true');
        localStorage.setItem('username', username);
        window.location.href = '/dashboard.html';
    } else {
        errorMessage.textContent = 'Invalid credentials. Please try again.';
        errorMessage.classList.add('show');
    }
});

if (localStorage.getItem('loggedIn') === 'true') {
    window.location.href = '/dashboard.html';
}

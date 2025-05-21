class AuthSystem {
    constructor() {
        this.users = [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.ADMIN_EMAIL = 'admin@admin.com';
        this.loadUsers();
        this.initializeEventListeners();
        this.updateUserMenu();
    }

    initializeEventListeners() {
        const loginForm = document.getElementById('login');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('register');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegistration(e));
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userIdOrEmail = formData.get('userId');
        const password = formData.get('password');

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => 
            (u.userId.toLowerCase() === userIdOrEmail.toLowerCase() || 
             u.email.toLowerCase() === userIdOrEmail.toLowerCase()) && 
            u.password === password
        );
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            const redirectPath = user.email === this.ADMIN_EMAIL ? 
                '../Admin/Admin.html' : 
                '../landingpage.html';
                
            this.showNotificationAndRedirect('Login successful!', 'success', redirectPath);
        } else {
            this.showNotification('Invalid credentials!', 'error');
        }
    }

    handleRegistration(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const userData = {
            userId: formData.get('userId'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            country: formData.get('country'),
            dob: formData.get('dob'),
            age: formData.get('age')
        };

        if (this.validateRegistration(userData)) {
            this.registerUser(userData);
            this.showNotification('Registration successful! Please login.', 'success');
            login(); // Switch to login form
        }
    }

    validateRegistration(userData) {
        // Add console logs to help debug
        console.log('Validating registration for:', userData);
        console.log('Existing users:', this.users);

        // Clear any existing users with the same ID from localStorage
        // This is temporary for debugging
        const cleanedUsers = this.users.filter(user => {
            console.log('Comparing:', user.userId, userData.userId);
            return user.userId.toLowerCase() !== userData.userId.toLowerCase();
        });
        this.users = cleanedUsers;
        this.saveUsers();

        if (userData.password !== userData.confirmPassword) {
            this.showNotification('Passwords do not match!', 'error');
            return false;
        }

        // Check if userId is empty or undefined
        if (!userData.userId || userData.userId.trim() === '') {
            this.showNotification('User ID is required!', 'error');
            return false;
        }

        const existingUser = this.users.some(user => 
            user.userId.toLowerCase() === userData.userId.toLowerCase()
        );
        console.log('User ID exists:', existingUser);
        
        if (existingUser) {
            this.showNotification('User ID already exists!', 'error');
            return false;
        }

        const existingEmail = this.users.some(user => 
            user.email.toLowerCase() === userData.email.toLowerCase()
        );
        console.log('Email exists:', existingEmail);
        
        if (existingEmail) {
            this.showNotification('Email already registered!', 'error');
            return false;
        }

        return true;
    }

    registerUser(userData) {
        const user = {
            ...userData,
            id: Date.now(),
            role: userData.email === this.ADMIN_EMAIL ? 'admin' : 'user',
            status: 'active',
            createdAt: new Date().toISOString()
        };
        delete user.confirmPassword;

        this.users.push(user);
        this.saveUsers();

        // Update admin dashboard if it exists
        if (window.adminDashboard) {
            window.adminDashboard.loadRegisteredUsers();
            window.adminDashboard.updateStatCards();
        }

        this.showNotification('Registration successful! Please login.', 'success');
        login(); // Switch to login form
    }

    loadUsers() {
        const savedUsers = localStorage.getItem('users');
        this.users = savedUsers ? JSON.parse(savedUsers) : [];
        
        // Add default admin if no users exist
        if (this.users.length === 0) {
            this.users.push({
                userId: 'admin',
                email: this.ADMIN_EMAIL,
                password: 'admin123',
                role: 'admin',
                status: 'active',
                createdAt: new Date().toISOString()
            });
            this.saveUsers();
        }
    }

    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    logout(redirectPath = 'landingpage.html') {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showNotificationAndRedirect('Logged out successfully', 'success', redirectPath);
    }

    updateUserMenu() {
        const userMenuContainer = document.getElementById('user-menu-container');
        if (!userMenuContainer) return;

        if (this.currentUser) {
            userMenuContainer.innerHTML = `
                <div class="user-menu">
                    <button class="user-menu-btn">
                        ${this.currentUser.userId}
                    </button>
                    <div class="dropdown-menu">
                        ${this.currentUser.email !== this.ADMIN_EMAIL ? 
                            '<a href="profile.html">Profile</a>' : 
                            '<a href="Admin/Admin.html">Dashboard</a>'}
                        <button onclick="auth.logout()">Logout</button>
                    </div>
                </div>
            `;

            const userMenuBtn = userMenuContainer.querySelector('.user-menu-btn');
            const dropdownMenu = userMenuContainer.querySelector('.dropdown-menu');
            
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                dropdownMenu.classList.remove('show');
            });
        } else {
            userMenuContainer.innerHTML = `
                <a href="Login/SignUp.html" class="join-us-btn-wrapper">
                    <button class="btn join-us-btn">Join Us</button>
                </a>
            `;
        }
    }

    

    showNotification(message, type = 'success') {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        // Add notification to body
        document.body.appendChild(notification);

        // Remove notification after delay
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 500);
        }, 3000);
    }

    // Add this new method to handle notification with redirect
    showNotificationAndRedirect(message, type, redirectPath) {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create new notification with same styling as showNotification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.padding = '15px 35px';  // Adjusted padding
        notification.style.borderRadius = '10px';  // Adjusted border radius
        notification.style.backgroundColor = '#2ecc71';  // Specific green color
        notification.style.fontSize = '16px';  // Match font size
        notification.style.fontWeight = '500';  // Semi-bold text
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';  // Add subtle shadow
        
        // Add notification to body
        document.body.appendChild(notification);

        // Add fade-out animation before redirect
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
                window.location.href = redirectPath;
            }, 500);
        }, 1500);
    }
}

// Initialize auth system globally
window.auth = new AuthSystem();
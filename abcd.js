// Get all food items and details sections
const foodItems = document.querySelectorAll('.food');
const detailsSections = document.querySelectorAll('.details');
const closeButtons = document.querySelectorAll('.details .fas.fa-times');

// Add click event to each food item
foodItems.forEach(item => {
    item.addEventListener('click', () => {
        const target = item.getAttribute('data-name');
        const detail = document.querySelector(`.details[data-target="${target}"]`);
        if (detail) {
            detail.classList.add('active');
        }
    });
});

// Add click event to each close button
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        button.parentElement.classList.remove('active');
    });
});

// Close card when clicking outside of it
window.addEventListener('click', (event) => {
    detailsSections.forEach(detail => {
        if (event.target === detail) {
            detail.classList.remove('active');
        }
    });
});

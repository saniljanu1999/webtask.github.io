document.addEventListener('DOMContentLoaded', () => {
    const inventoryList = document.getElementById('inventory-list');
    const itemForm = document.getElementById('item-form');
    const itemIdInput = document.getElementById('item-id');
    const itemNameInput = document.getElementById('item-name');
    const itemQuantityInput = document.getElementById('item-quantity');
    const itemPriceInput = document.getElementById('item-price');
    const showAddItemBtn = document.getElementById('show-add-item-btn');
    const addItemFormSection = document.getElementById('add-item-form-section');
    const cancelBtn = document.getElementById('cancel-btn');
    const submitBtn = document.getElementById('submit-btn');
    const feedbackMessage = document.getElementById('feedback-message');

    let inventory = JSON.parse(localStorage.getItem('inventory')) || [];

    // Helper function to show a feedback message
    function showFeedback(message, isError = false) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = isError ? 'feedback-error' : 'feedback-success';
        feedbackMessage.classList.remove('hidden');
        setTimeout(() => {
            feedbackMessage.classList.add('hidden');
        }, 3000);
    }

    // Render the inventory table from the 'inventory' array
    function renderInventory() {
        inventoryList.innerHTML = '';
        inventory.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td class="actions-cell">
                    <button class="edit-btn" data-id="${item.id}">Edit</button>
                    <button class="delete-btn" data-id="${item.id}">Delete</button>
                </td>
            `;
            inventoryList.appendChild(row);
        });
    }

    // Save inventory to local storage
    function saveInventory() {
        localStorage.setItem('inventory', JSON.stringify(inventory));
    }

    // Show the Add/Edit form
    showAddItemBtn.addEventListener('click', () => {
        addItemFormSection.classList.remove('hidden');
        showAddItemBtn.classList.add('hidden');
        itemForm.reset();
        itemIdInput.value = '';
        submitBtn.textContent = 'Add Item';
    });

    // Cancel and hide the Add/Edit form
    cancelBtn.addEventListener('click', () => {
        addItemFormSection.classList.add('hidden');
        showAddItemBtn.classList.remove('hidden');
        itemForm.reset();
    });

    // Handle form submission for adding and editing items
    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = itemIdInput.value;
        const name = itemNameInput.value.trim();
        const quantity = parseInt(itemQuantityInput.value, 10);
        const price = parseFloat(itemPriceInput.value);

        // Validation
        if (!name || isNaN(quantity) || quantity < 0 || isNaN(price) || price < 0) {
            showFeedback('Please fill out all fields correctly.', true);
            return;
        }

        if (id) {
            // Edit existing item
            const itemIndex = inventory.findIndex(item => item.id === parseInt(id, 10));
            if (itemIndex !== -1) {
                inventory[itemIndex] = { ...inventory[itemIndex], name, quantity, price };
                showFeedback('Item updated successfully!');
            }
        } else {
            // Add new item
            const newItem = {
                id: Date.now(), // Simple unique ID
                name,
                quantity,
                price
            };
            inventory.push(newItem);
            showFeedback('Item added successfully!');
        }

        saveInventory();
        renderInventory();
        itemForm.reset();
        addItemFormSection.classList.add('hidden');
        showAddItemBtn.classList.remove('hidden');
    });

    // Handle Edit and Delete button clicks using event delegation
    inventoryList.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const id = parseInt(e.target.dataset.id, 10);
            const itemToEdit = inventory.find(item => item.id === id);

            if (itemToEdit) {
                itemIdInput.value = itemToEdit.id;
                itemNameInput.value = itemToEdit.name;
                itemQuantityInput.value = itemToEdit.quantity;
                itemPriceInput.value = itemToEdit.price;
                addItemFormSection.classList.remove('hidden');
                showAddItemBtn.classList.add('hidden');
                submitBtn.textContent = 'Save Changes';
            }
        } else if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.dataset.id, 10);
            if (confirm('Are you sure you want to delete this item?')) {
                inventory = inventory.filter(item => item.id !== id);
                saveInventory();
                renderInventory();
                showFeedback('Item deleted successfully!');
            }
        }
    });

    // Initial render
    renderInventory();
});

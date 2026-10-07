document.addEventListener("DOMContentLoaded", () => {

    const userEmail = localStorage.getItem("userEmail");

    if (!userEmail) {
        window.location.href = "index.html";
        return;
    }

    const form = document.getElementById("contactForm");
    const contactsList = document.getElementById("contactsList");
    const logoutButton = document.getElementById("logoutButton");

    let contacts = [];

    function escapeHTML(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =========================
       DISPLAY CONTACTS
    ========================= */

    function displayContacts(contactData) {

        contacts = contactData || [];

        if (contacts.length === 0) {

            contactsList.innerHTML = `
                <div class="empty-contacts">
                    <div class="empty-icon">👤</div>
                    <p>No contacts added yet.</p>
                    <small>Add a trusted contact using the form.</small>
                </div>
            `;

            return;
        }

        contactsList.innerHTML = "";

        contacts.forEach(contact => {

            const card = document.createElement("div");

            card.className = "saved-contact-card";

            card.innerHTML = `
                <div class="saved-contact-info">

                    <h3>
                        ${escapeHTML(contact.name)}
                    </h3>

                    <p>
                        <strong>Mobile:</strong>
                        ${escapeHTML(contact.phone)}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${escapeHTML(
                            contact.email || "Not provided"
                        )}
                    </p>

                </div>

                <div class="contact-actions">

                    <button
                        type="button"
                        class="edit-contact-button"
                        data-contact-id="${escapeHTML(
                            contact.contactId
                        )}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-contact-button"
                        data-contact-id="${escapeHTML(
                            contact.contactId
                        )}"
                    >
                        Delete
                    </button>

                </div>
            `;

            contactsList.appendChild(card);
        });

        /* =========================
           EDIT BUTTONS
        ========================= */

        document
            .querySelectorAll(".edit-contact-button")
            .forEach(button => {

                button.addEventListener("click", () => {

                    const contactId =
                        button.dataset.contactId;

                    const contact =
                        contacts.find(
                            item =>
                                item.contactId === contactId
                        );

                    if (contact) {
                        openEditForm(contact);
                    }
                });
            });

        /* =========================
           DELETE BUTTONS
        ========================= */

        document
            .querySelectorAll(".delete-contact-button")
            .forEach(button => {

                button.addEventListener("click", () => {

                    const contactId =
                        button.dataset.contactId;

                    const contact =
                        contacts.find(
                            item =>
                                item.contactId === contactId
                        );

                    if (contact) {
                        deleteContact(contact);
                    }
                });
            });
    }

    /* =========================
       LOAD CONTACTS
    ========================= */

    async function loadContacts() {

        contactsList.innerHTML = `
            <div class="empty-contacts">
                <p>Loading saved contacts...</p>
            </div>
        `;

        try {

            const response = await fetch(
                `${AWS_CONFIG.apiUrl}/emergency-contacts?userId=${encodeURIComponent(userEmail)}`,
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Unable to load emergency contacts."
                );
            }

            displayContacts(data.contacts || []);

        } catch (error) {

            console.error(
                "Error loading contacts:",
                error
            );

            contactsList.innerHTML = `
                <div class="empty-contacts">
                    <p>Unable to load saved contacts.</p>
                    <small>
                        Please refresh the page and try again.
                    </small>
                </div>
            `;
        }
    }

    /* =========================
       OPEN EDIT FORM
    ========================= */

    function openEditForm(contact) {

        const editName = prompt(
            "Enter the contact's full name:",
            contact.name || ""
        );

        if (editName === null) return;

        const editPhone = prompt(
            "Enter the UK mobile number:",
            contact.phone || ""
        );

        if (editPhone === null) return;

        const editEmail = prompt(
            "Enter the email address:",
            contact.email || ""
        );

        if (editEmail === null) return;

        updateContact(
            contact.contactId,
            editName.trim(),
            editPhone.trim(),
            editEmail.trim()
        );
    }

    /* =========================
       UPDATE CONTACT
    ========================= */

    async function updateContact(
        contactId,
        name,
        phone,
        email
    ) {

        if (!name || !phone) {

            alert(
                "Name and UK mobile number are required."
            );

            return;
        }

        try {

            const response = await fetch(
                `${AWS_CONFIG.apiUrl}/emergency-contact`,
                {
                    method: "PUT",

                    headers: getAuthHeaders(),

                    body: JSON.stringify({
                        userId: userEmail,
                        contactId: contactId,
                        name: name,
                        phone: phone,
                        email: email
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Unable to update contact."
                );
            }

            alert(
                "Emergency contact updated successfully."
            );

            await loadContacts();

        } catch (error) {

            console.error(
                "Error updating contact:",
                error
            );

            alert(
                "Unable to update emergency contact. Please try again."
            );
        }
    }

    /* =========================
       DELETE CONTACT
    ========================= */

    async function deleteContact(contact) {

        const confirmed = confirm(
            `Are you sure you want to delete "${contact.name}" from your trusted contacts?`
        );

        if (!confirmed) return;

        try {

            const response = await fetch(
                `${AWS_CONFIG.apiUrl}/emergency-contact`,
                {
                    method: "DELETE",

                    headers: getAuthHeaders(),

                    body: JSON.stringify({
                        userId: userEmail,
                        contactId: contact.contactId
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Unable to delete contact."
                );
            }

            alert(
                "Emergency contact deleted successfully."
            );

            await loadContacts();

        } catch (error) {

            console.error(
                "Error deleting contact:",
                error
            );

            alert(
                "Unable to delete emergency contact. Please try again."
            );
        }
    }

    /* =========================
       ADD CONTACT
    ========================= */

    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const name =
                    document
                        .getElementById("contactName")
                        .value
                        .trim();

                const phone =
                    document
                        .getElementById("contactPhone")
                        .value
                        .trim();

                const email =
                    document
                        .getElementById("contactEmail")
                        .value
                        .trim();

                if (!name || !phone) {

                    alert(
                        "Please enter the contact's name and UK mobile number."
                    );

                    return;
                }

                try {

                    const response = await fetch(
                        `${AWS_CONFIG.apiUrl}/emergency-contact`,
                        {
                            method: "POST",

                            headers: getAuthHeaders(),

                            body: JSON.stringify({
                                userId: userEmail,
                                name: name,
                                phone: phone,
                                email: email
                            })
                        }
                    );

                    const data =
                        await response.json();

                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        throw new Error(
                            data.message ||
                            "Unable to add emergency contact."
                        );
                    }

                    alert(
                        "Emergency contact added successfully."
                    );

                    form.reset();

                    await loadContacts();

                } catch (error) {

                    console.error(
                        "Error adding contact:",
                        error
                    );

                    alert(
                        "Unable to add emergency contact. Please try again."
                    );
                }
            }
        );
    }

    /* =========================
       LOGOUT
    ========================= */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            () => {

                localStorage.removeItem("idToken");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("userEmail");
                localStorage.removeItem(
                    "pendingVerificationEmail"
                );

                window.location.href =
                    "index.html";
            }
        );
    }

    /* =========================
       INITIAL LOAD
    ========================= */

    loadContacts();

});
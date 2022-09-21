document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    document.querySelector('#compose-form').addEventListener('submit', sent_email);

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#message').style.display = 'none';
    document.querySelector('#mail-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#mail-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Get Mails
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {

            emails.forEach(email => {
                const element = document.createElement('div');
                element.classList.add('border', 'border-dark', 'mb-3', 'p-2', 'rounded');
                if (email.read === true) {
                    element.classList.add('bg-secondary');
                    element.classList.add('text-white');
                } else {
                    element.classList.add('bg-white');
                }
                element.innerHTML = `
                <div class="row">
                    <div class="col-3 "><b> ${email.sender} </b></div>
                    <div class="col-6"> ${email.subject} </div>
                    <div class="col-3 text-right"> ${email.timestamp} </div>
                </div>
                `
                element.addEventListener('click', () => load_email(email.id, mailbox));

                document.querySelector('#emails-view').append(element);
            });
        });
}

function sent_email() {

    event.preventDefault();

    // Getting Form Elements
    const recipient = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;

    // Fetch with POST method
    fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: recipient,
                subject: subject,
                body: body,
            })
        })
        .then(response => response.json())
        .then(result => {
            // Print result
            if (result.message === "Email sent successfully.") {
                load_mailbox('sent');
            } else {
                document.querySelector('#message').innerHTML = `Error: ${result.error}`;
                document.querySelector('#message').style.display = 'block';
            }
        });
}

function load_email(id, mailbox) {

    event.preventDefault();

    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#mail-view').style.display = 'block';
    document.querySelector("#reply-button").addEventListener('click', () => compose_reply(id));

    fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {

            var receivers = Array(email.recipients).toString();

            document.querySelector("#mail-details").innerHTML = `
            <b>From: </b> ${email.sender}<br>
            <b>To: </b> ${receivers}<br>
            <b>Subject: </b> ${email.subject}<br>
            <b>Time: </b> ${email.timestamp}<br>`;

            document.querySelector("#mail-body").innerHTML = `${email.body}`;

        });

    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    });

    if (mailbox !== 'sent') {
        if (mailbox === 'inbox') {
            document.querySelector("#archive-button").innerHTML = 'Archive';
            document.querySelector("#archive-button").addEventListener('click', function() {
                fetch(`/emails/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: true
                    })
                });
                load_mailbox('inbox');
            })
        } else {
            document.querySelector("#archive-button").innerHTML = 'Unarchive';
            document.querySelector("#archive-button").addEventListener('click', function() {
                fetch(`/emails/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: false
                    })
                });
                load_mailbox('inbox');
            })
        }
    } else {
        document.querySelector("#archive").style.display = 'none';
    }
}

function compose_reply(id) {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#message').style.display = 'none';
    document.querySelector('#mail-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {

            if (email.subject.slice(0, 3) === 'Re:') {
                document.querySelector('#compose-subject').value = email.subject;
            } else {
                document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
            }

            document.querySelector('#compose-recipients').value = email.sender;
            document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: \n\t ${email.body}`;

        });

}
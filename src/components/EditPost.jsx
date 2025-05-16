import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../assets/styles/EditPost.css'

function EditPost() {
    const location = useLocation();
    const navigate = useNavigate();

    // Get the article from the state passed via Link
    const { post } = location.state;

    // Store the article as a single object in the state
    const [editedPost, setEditedPost] = useState({ ...post });

    // Function to handle each field change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedPost(prevPost => ({
            ...prevPost,
            [name]: value,
        }));
    };

    // Function for saving changes
    const handleSubmit = (e) => {
        e.preventDefault();
        // Data saving will be processed here
        console.log('Updated Post:', editedPost);

        // After saving, redirect back to the main page
        navigate('/');
    };

    return (
        <div className='main'>
            <h2>Edit article</h2>
            <form onSubmit={handleSubmit}>

                <div>
                    <label>Name:</label>
                    <input
                        type="text"
                        name="title"
                        value={editedPost.title}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Content:</label>
                    <textarea
                        name="content"
                        value={editedPost.content}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Author:</label>
                    <input
                        type="text"
                        name="author"
                        value={editedPost.author}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Save</button>
            </form>
        </div>
    );
}

export default EditPost;
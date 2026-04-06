import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

function EditModal() {
	const [showModal, setShowModal] = useState(false);

	const handleOpenModal = () => {
		setShowModal(true);
	};

	const handleCloseModal = () => {
		setShowModal(false);
	};

	return (
		<>
			<button
				className="floatingEditButton"
				onClick={handleOpenModal}
				aria-label="Open editor"
				title="Open editor"
			>
				✏
			</button>

			<Modal show={showModal} onHide={handleCloseModal} centered>
				<Modal.Header closeButton>
					<Modal.Title>Editor</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>Add your editor content here.</p>
					<textarea
						className="form-control"
						rows="6"
						placeholder="Type something..."
					></textarea>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={handleCloseModal}>
						Close
					</Button>
					<Button variant="primary" onClick={handleCloseModal}>
						Save
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}

export default EditModal;

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import notFoundGif from '../images/notFound.gif';
import './NotFound.css';
import { useDispatch } from 'react-redux';
import { setCurrentScreen } from '../redux/userSettings';

function NotFound() {
	const Dispatch = useDispatch();
	return (
		<div className="not-found-page d-flex flex-column align-items-center justify-content-center min-vh-100">
			<img
				src={notFoundGif}
				alt="404 Not Found"
				className="dark-mode-gif mb-4 fade-in"
			/>

			<h1 className="not-found-title display-1 fw-bold mb-2 text-info fade-in delay-100">
				404
			</h1>
			<h2 className="mb-4 fw-bold text-light fade-in delay-200">
				Oops! Page not found.
			</h2>
			<p className="not-found-text text-secondary mb-5 text-center fade-in delay-200">
				The page you are looking for has been disconnected or doesn't
				exist. Let's get you back to a grounded connection.
			</p>
			<Button
				as={Link}
				onClick={() => Dispatch(setCurrentScreen('/'))}
				to="/"
				className="rounded-pill feature-btn px-5 py-3 fw-bold fade-in delay-300"
				style={{ '--card-color': '#38bdf8' }}
			>
				Return to Home
			</Button>
		</div>
	);
}

export default NotFound;

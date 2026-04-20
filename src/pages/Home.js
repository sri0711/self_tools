import React from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentScreen } from '../redux/userSettings';

function Home() {
	const Dispatch = useDispatch();

	return (
		<div>
			<button>
				<a
					href="#/viewer"
					onClick={() => Dispatch(setCurrentScreen('/viewer'))}
				>
					{' '}
					click
				</a>
			</button>
		</div>
	);
}

export default Home;

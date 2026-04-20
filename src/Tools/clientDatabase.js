/**
 * Web SQL is deprecated in modern browsers.
 * IndexedDB is the modern standard for storing large structures on the client side.
 * This utility provides a simple interface to store and retrieve large datasets.
 */
const DB_NAME = 'SelfToolsDatabase';
const DB_VERSION = 1;
const STORE_NAME = 'large_files_store';

export const initDB = () => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'id' });
			}
		};

		request.onsuccess = (event) => {
			resolve(event.target.result);
		};

		request.onerror = (event) => {
			reject(event.target.error);
		};
	});
};

export const storeLargeData = async (id, data) => {
	const db = await initDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);

		const request = store.put({ id, data });

		request.onsuccess = () => resolve(true);
		request.onerror = (err) => reject(err);
	});
};

export const retrieveLargeData = async (id) => {
	const db = await initDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);

		const request = store.get(id);

		request.onsuccess = (event) => {
			resolve(event.target.result ? event.target.result.data : null);
		};
		request.onerror = (err) => reject(err);
	});
};

export const storeChunkedData = async (baseId, dataArray, onProgress) => {
	const db = await initDB();
	const chunkSize = 20000;
	const chunks = Math.ceil(dataArray.length / chunkSize);

	return new Promise(async (resolve, reject) => {
		try {
			const metaTx = db.transaction(STORE_NAME, 'readwrite');
			metaTx.objectStore(STORE_NAME).put({
				id: `${baseId}_meta`,
				chunks,
				totalRows: dataArray.length
			});

			for (let i = 0; i < chunks; i++) {
				const chunkData = dataArray.slice(
					i * chunkSize,
					(i + 1) * chunkSize
				);
				await new Promise((res, rej) => {
					const tx = db.transaction(STORE_NAME, 'readwrite');
					const req = tx
						.objectStore(STORE_NAME)
						.put({ id: `${baseId}_chunk_${i}`, data: chunkData });
					req.onsuccess = res;
					req.onerror = rej;
				});

				if (onProgress)
					onProgress(Math.round(((i + 1) / chunks) * 100));
				await new Promise((r) => setTimeout(r, 10)); // Yield to keep UI smooth
			}
			resolve(true);
		} catch (err) {
			reject(err);
		}
	});
};

export const retrieveChunkedData = async (baseId, onProgress) => {
	const db = await initDB();
	try {
		const meta = await new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const req = tx.objectStore(STORE_NAME).get(`${baseId}_meta`);
			req.onsuccess = (e) => resolve(e.target.result);
			req.onerror = reject;
		});

		if (!meta || !meta.chunks) return null;

		let fullData = [];
		for (let i = 0; i < meta.chunks; i++) {
			const chunk = await new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readonly');
				const req = tx
					.objectStore(STORE_NAME)
					.get(`${baseId}_chunk_${i}`);
				req.onsuccess = (e) =>
					resolve(e.target.result ? e.target.result.data : []);
				req.onerror = reject;
			});
			fullData = fullData.concat(chunk);
			if (onProgress)
				onProgress(Math.round(((i + 1) / meta.chunks) * 100));
			await new Promise((r) => setTimeout(r, 10)); // Yield
		}
		return fullData;
	} catch (err) {
		console.error('Error retrieving chunked data', err);
		return null;
	}
};

export const getDatabaseMeta = async (baseId) => {
	const db = await initDB();
	try {
		return await new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const req = tx.objectStore(STORE_NAME).get(`${baseId}_meta`);
			req.onsuccess = (e) => resolve(e.target.result);
			req.onerror = reject;
		});
	} catch (err) {
		return null;
	}
};

export const getDbChunk = async (baseId, chunkIndex) => {
	const db = await initDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readonly');
		const req = tx
			.objectStore(STORE_NAME)
			.get(`${baseId}_chunk_${chunkIndex}`);
		req.onsuccess = (e) =>
			resolve(e.target.result ? e.target.result.data : []);
		req.onerror = reject;
	});
};

export const retrieveDataByPage = async (baseId, page, limit) => {
	const meta = await getDatabaseMeta(baseId);
	if (!meta || !meta.chunks) return { data: [], totalRows: 0 };

	const db = await initDB();
	const chunkSize = 20000;
	const startIndex = (page - 1) * limit;
	const endIndex = page * limit;

	const startChunk = Math.floor(startIndex / chunkSize);
	const endChunk = Math.floor((endIndex - 1) / chunkSize);

	let fetchedData = [];
	for (let i = startChunk; i <= endChunk; i++) {
		const chunk = await new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const req = tx.objectStore(STORE_NAME).get(`${baseId}_chunk_${i}`);
			req.onsuccess = (e) =>
				resolve(e.target.result ? e.target.result.data : []);
			req.onerror = reject;
		});
		fetchedData = fetchedData.concat(chunk);
	}

	const chunkStartIndex = startChunk * chunkSize;
	const sliceStart = startIndex - chunkStartIndex;
	const sliceEnd = endIndex - chunkStartIndex;

	return {
		data: fetchedData.slice(sliceStart, sliceEnd),
		totalRows: meta.totalRows
	};
};

export const writeDbChunk = async (baseId, chunkIndex, data) => {
	const db = await initDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const req = tx
			.objectStore(STORE_NAME)
			.put({ id: `${baseId}_chunk_${chunkIndex}`, data });
		req.onsuccess = () => resolve(true);
		req.onerror = reject;
	});
};

export const writeDbMeta = async (baseId, chunks, totalRows) => {
	const db = await initDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const req = tx
			.objectStore(STORE_NAME)
			.put({ id: `${baseId}_meta`, chunks, totalRows });
		req.onsuccess = () => resolve(true);
		req.onerror = reject;
	});
};

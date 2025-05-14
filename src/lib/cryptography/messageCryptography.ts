type ChatMessage = {
	senderUsername: string;
	message: string;
	timestamp: string;
	id: string
};
type EncryptedMessage = {
	cipherText: string;
	iv: Uint8Array;
	sentAt: Date;
	senderId: string;
	id: string
}


export const importPublicKey = async (base64: string): Promise<CryptoKey> => {
	const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
	return await crypto.subtle.importKey(
		"spki",
		binary.buffer,
		{ name: "ECDH", namedCurve: "P-256" },
		true,
		[]
	);
}

export const importPrivateKey = async (base64: string): Promise<CryptoKey> => {
	const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
	return await crypto.subtle.importKey(
		"pkcs8",
		binary.buffer,
		{ name: "ECDH", namedCurve: "P-256" },
		true,
		["deriveKey"]
	);
}


export const deriveAESKey = async (
	myPrivateKey: CryptoKey,
	recipientPublicKey: CryptoKey
): Promise<CryptoKey> => {
	return await crypto.subtle.deriveKey(
		{ name: "ECDH", public: recipientPublicKey },
		myPrivateKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"]
	);
}

export const encryptMessage = async (aesKey: CryptoKey, message: string) => {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encoded = new TextEncoder().encode(message);
	const cipherTextBuffer = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		aesKey,
		encoded
	);
	const cipherText = btoa(String.fromCharCode(...new Uint8Array(cipherTextBuffer)));
	const ivBase64 = btoa(String.fromCharCode(...iv));
	return { cipherText, ivBase64 };
}

export const decryptMessage = async (
	aesKey: CryptoKey,
	encryptedMessage: string,
	ivBase64: string) => {
	const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
	const cipherText = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));


	try {
		const decryptedMessageBuffer = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv },
			aesKey, cipherText
		);
		const decode = new TextDecoder().decode(decryptedMessageBuffer);
		return decode;
	} catch (err: any) {
		throw new Error("Decryption failed: Check Private Key")
	}
	
}

function to12ByteIV(input: unknown): Uint8Array {
	if (Array.isArray(input) && input.length === 12 && input.every(n => typeof n === 'number')) {
		return new Uint8Array(input);
	}

	if (typeof input === 'object' && input !== null) {
		const values = Object.values(input);
		if (values.length === 12 && values.every(v => typeof v === 'number')) {
			return new Uint8Array(values);
		}
	}

	throw new Error('Invalid IV: expected 12-byte array');
}


export const decryptConversation = async (// 	
	// @ts-ignore
	messages, // add type later
	currentUser: { id: string, username: string },
	otherUser: { 
		publicKey: string,
		username: string,
		id:string 
		},
	currentUserPrivateKey: string

) => {
	const importedPrivateKey = await importPrivateKey(currentUserPrivateKey) // test 2 purposes
	const importedPublicKey = await importPublicKey(otherUser.publicKey);
	const sharedAesKey = await deriveAESKey(importedPrivateKey, importedPublicKey)
	if (messages.length > 0) {
		const decryptedMessages = await Promise.all(
			messages.map(async (msg: EncryptedMessage) => {
				let ivArr = to12ByteIV(msg.iv)
				const ivBase64 = btoa(String.fromCharCode(...ivArr));
				const cipherText1 = msg.cipherText;
				try {
					let decrypted = await decryptMessage(sharedAesKey, cipherText1, ivBase64);

					return {
						message: decrypted,
						sentAt: msg.sentAt,
						senderUsername: msg.senderId === currentUser.id ? currentUser.username : otherUser.username,
						id: msg.id
					}

				} catch (err: any) {
				
				throw new Error(err.message)
				}

			})
		);
		return decryptedMessages;
	}
}


export const  generateIdentityKeypair = async () => {
    const { publicKey, privateKey } = await crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256"
      },
      true,
      ["deriveKey", "deriveBits"]
    );
  
    const publicKeyRaw = await crypto.subtle.exportKey("spki", publicKey);
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)));
  
    const privateKeyRaw = await crypto.subtle.exportKey("pkcs8", privateKey);
    const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyRaw)));
  
    return {
      publicKey,
      privateKey,
      publicKeyBase64,
      privateKeyBase64, // ✅ use this for display + copy
      privateKeyRaw: new Uint8Array(privateKeyRaw)
    };
  }
  
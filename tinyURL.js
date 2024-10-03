// DO NOT CHECK-IN
const apiToken = 'INSERT_TOKEN_HERE';

const shortenUrl = async (longUrl) => {
    try {
        const response = await fetch(`https://api.tinyurl.com/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: longUrl })
        });

        // Check if response is ok (status 200-299)
        if (response.ok) {
            const data = await response.json();
            console.error('Response:', JSON.stringify(data));
            return data.data.tiny_url;
        } else {
            // If there's an error (e.g., out of quota), return the long URL
            console.error('Error shortening the URL:', response.status, response.statusText);
            return longUrl;
        }
    } catch (error) {
        // In case of network or other errors, also return the long URL
        console.error('Error occurred trying to use TinyUrl - using long url:', error);
        return longUrl;
    }
};

module.exports = { shortenUrl };

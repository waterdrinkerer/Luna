export const fetchQuote = async () => {
  try {
    const response = await fetch('https://api.api-ninjas.com/v1/quotes', {
      headers: {
        'X-Api-Key': import.meta.env.VITE_API_NINJAS_KEY,
      },
    });

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        text: data[0].quote,
        author: data[0].author,
      };
    }
  } catch (error) {
    console.error('Failed to fetch quote:', error);
  }

  return {
    text: 'Stay strong. You got this!',
    author: 'Luna',
  };
};

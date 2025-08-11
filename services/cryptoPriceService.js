// import axios from 'axios';

// export const fetchCryptoPrices = async () => {
//   try {
//     const response = await axios.get('https://coinranking1.p.rapidapi.com/coins', {
//       params: {
//         timePeriod: '24h',
//         orderBy: 'marketCap',
//         orderDirection: 'desc',
//         limit: '400',
//         offset: '0'
//       },
//       headers: {
//         'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
//         'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
//       } 
//     });

//     if (response.data.status !== 'success') {
//       throw new Error('Failed to fetch crypto prices');
//     }

//     return response.data.data.coins.map(coin => ({
//       symbol: coin.symbol,
//       price: parseFloat(coin.price)
//     }));
//   } catch (error) {
//     console.error('Error fetching crypto prices:', error);
//     throw error;
//   }
// };
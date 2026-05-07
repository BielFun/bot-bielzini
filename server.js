const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let promocoes = [];

// DICIONÁRIO DE ABREVIAÇÕES
function traduzAbreviacao(texto) {
  const dicionario = {
    'sla': 'sei lá', 'slk': 'sei lá, cara', 'tmj': 'tamo junto',
    'vlw': 'valeu', 'blz': 'beleza', 'fmz': 'firmeza', 'vdd': 'verdade',
    'pq': 'porque', 'q': 'que', 'n': 'não', 'tbm': 'também',
    'mt': 'muito', 'mto': 'muito', 'vc': 'você', 'voce': 'você',
    'cmg': 'comigo', 'ctg': 'contigo', 'hj': 'hoje', 'agr': 'agora',
    'aq': 'aqui', 'aki': 'aqui', 'dps': 'depois', 'antes': 'antes',
    'flw': 'falou', 'fml': 'família', 'pdc': 'pode crer', 'sfd': 'safado',
    'lgd': 'lindo', 'top': 'incrível', 'brabo': 'muito bom', 'braba': 'muito boa'
  };
  
  let textoTraduzido = texto.toLowerCase();
  for (let [abrev, completo] of Object.entries(dicionario)) {
    textoTraduzido = textoTraduzido.replace(new RegExp(`\\b${abrev}\\b`, 'g'), completo);
  }
  return textoTraduzido;
}

// PEGA IMAGEM AUTOMÁTICA
async function pegarImagem(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 8000
    });
    const $ = cheerio.load(data);
    let img = $('meta[property="og:image"]').attr('content') || 
              $('meta[name="twitter:image"]').attr('content') ||
              $('img').first().attr('src');
    
    if (img && !img.startsWith('http')) {
      const urlBase = new URL(url);
      img = urlBase.origin + img;
    }
    return img || 'https://via.placeholder.com/300x300/008000/FFFFFF?text=PROMO+BIELZINI';
  } catch {
    return 'https://via.placeholder.com/300x300/008000/FFFFFF?text=PROMO+BIELZINI';
  }
}

app.post('/api/promocao', async (req, res) => {
  try {
    const { texto, link, desc } = req.body;
    const descTraduzida = traduzAbreviacao(desc);
    
    let imagem = await pegarImagem(link);
    
    const novaPromo = {
      id: Date.now(),
      texto: texto,
      link: link,
      descricao: descTraduzida,
      imagem: imagem,
      data: new Date().toLocaleString('pt-BR')
    };
    
    promocoes.unshift(novaPromo);
    if (promocoes.length > 50) promocoes.pop();
    
    res.json({ sucesso: true, promocao: novaPromo });
  } catch (error) {
    res.status(500).json({ erro: 'Deu ruim no bot' });
  }
});

app.get('/api/promocoes', (req, res) => {
  res.json(promocoes);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🤖 Bot Bielzini rodando na porta ${PORT}`);
});

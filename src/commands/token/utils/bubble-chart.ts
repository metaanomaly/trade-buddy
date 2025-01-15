import * as d3 from 'd3';
import { createCanvas, loadImage, Canvas } from 'canvas';
import { TrendingTokenResponse } from './solanatracker';
import { logger } from '../../../utils/Logger';

interface BubbleData {
    name: string;
    marketCap: number;
    rawMarketCap: number;
    priceChange: number;
    imageUrl?: string;
}

async function isValidImageUrl(url: string): Promise<boolean> {
    try {
        logger.debug(`Validating image URL: ${url}`, 'BubbleChart');
        const response = await fetch(url);
        const contentType = response.headers.get('content-type');
        if (response.ok && contentType && ['image/jpeg', 'image/png', 'image/gif'].includes(contentType as string)) {
            return true;
        }
        logger.warn(`Invalid image URL or content type: ${url}`, 'BubbleChart');
        return false;
    } catch (error) {
        logger.error(`Error validating image URL: ${url}`, error as Error, 'BubbleChart');
        return false;
    }
}

export async function generateBubbleChart(tokens: TrendingTokenResponse[], timeframe: string): Promise<Buffer> {
    logger.debug(`Generating bubble chart for ${tokens.length} tokens`, 'BubbleChart');
    
    const width = 1200;
    const height = 800;
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    // Set black background
    context.fillStyle = '#000000';
    context.fillRect(0, 0, width, height);

    // Take top 40 tokens by market cap
    const top40Tokens = tokens
        .filter(token => token.pools[0]?.marketCap?.usd > 0)
        .sort((a, b) => b.pools[0].marketCap.usd - a.pools[0].marketCap.usd)
        .slice(0, 40);

    logger.debug(`Filtered to top 40 tokens`, 'BubbleChart');

    // Prepare data with enhanced market cap scaling
    const bubbleData: BubbleData[] = top40Tokens
        .map(token => {
            logger.debug(`Processing token: ${token.token.symbol}`, 'BubbleChart');
            // Use square root scaling instead of log for more dramatic size differences
            const marketCap = token.pools[0].marketCap.usd;
            const minMarketCap = Math.min(...top40Tokens.map(t => t.pools[0].marketCap.usd));
            const maxMarketCap = Math.max(...top40Tokens.map(t => t.pools[0].marketCap.usd));
            
            // Normalize and enhance the scale difference
            const normalizedSize = (marketCap - minMarketCap) / (maxMarketCap - minMarketCap);
            const enhancedSize = Math.pow(normalizedSize, 0.4) * 3 + 0.2; // Less aggressive power (0.4) and larger multiplier (3)

            return {
                name: token.token.symbol,
                marketCap: enhancedSize,
                rawMarketCap: token.pools[0].marketCap.usd,
                priceChange: token.events[timeframe]?.priceChangePercentage || 0,
                imageUrl: token.token.image
            };
        });

    // Create bubble layout with adjusted size
    const pack = d3.pack()
        .size([width - 80, height - 80])
        .padding(10);

    const root = d3.hierarchy({ children: bubbleData })
        .sum(d => d.marketCap);

    const circles = pack(root).leaves();

    // Helper function to draw text with stroke
    function drawTextWithStroke(text: string, x: number, y: number, fontSize: number) {
        context.lineWidth = 3;
        context.strokeStyle = '#000000';
        context.strokeText(text, x, y);
        context.fillStyle = '#ffffff';
        context.fillText(text, x, y);
    }

    // Draw bubbles with stroked text
    for (const circle of circles) {
        const d = circle.data as BubbleData;
        const x = circle.x;
        const y = circle.y;
        const r = circle.r;

        // Draw circle
        context.beginPath();
        context.arc(x, y, r, 0, 2 * Math.PI);
        const color = d.priceChange >= 0 ? '#1b4a1b' : '#4a1b1b';
        context.fillStyle = color;
        context.fill();
        context.strokeStyle = d.priceChange >= 0 ? '#00ff00' : '#ff0000';
        context.lineWidth = 2;
        context.stroke();

        // Draw token image if available
        if (d.imageUrl) {
            try {
                if (await isValidImageUrl(d.imageUrl)) {
                    const img = await loadImage(d.imageUrl);
                    const imgSize = r * 1.2;
                    context.save();
                    context.clip();
                    context.drawImage(img, x - imgSize/2, y - imgSize/2, imgSize, imgSize);
                    context.restore();
                }
            } catch (error) {
                logger.error(`Failed to load image for ${d.name}`, error as Error, 'BubbleChart');
            }
        }

        // Draw text with stroke
        const fontSize = r * 0.3;
        context.font = `bold ${fontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw symbol
        drawTextWithStroke(d.name, x, y + r * 0.1, fontSize);
        
        // Draw percentage
        drawTextWithStroke(
            `${d.priceChange >= 0 ? '+' : ''}${d.priceChange.toFixed(2)}%`,
            x,
            y + r * 0.4,
            fontSize
        );
    }

    logger.debug('Chart generation completed', 'BubbleChart');
    return canvas.toBuffer();
} 
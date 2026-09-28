import Parser from 'rss-parser';
import prisma from '../prisma';

const parser = new Parser();

const FEEDS = [
  'https://cvefeed.io/rssfeed/latest.xml',
  'https://www.cisa.gov/cybersecurity-advisories/all.xml',
  'https://www.bleepingcomputer.com/feed/',
  'https://feeds.feedburner.com/TheHackersNews',
];

export const collectThreats = async () => {
  let newThreatsCount = 0;

  for (const feedUrl of FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      
      for (const item of feed.items) {
        if (!item.title || !item.link) continue;

        // Check if threat already exists
        const exists = await prisma.threatIntelligence.findUnique({
          where: { url: item.link },
        });

        if (!exists) {
          await prisma.threatIntelligence.create({
            data: {
              source_name: feed.title || 'Unknown Source',
              url: item.link,
              title: item.title,
              content: item.contentSnippet || item.content || item.title,
              published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
            },
          });
          newThreatsCount++;
        }
      }
    } catch (error) {
      console.error(`Failed to collect from ${feedUrl}:`, error);
    }
  }

  return newThreatsCount;
};

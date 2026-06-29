import { createClient } from '@supabase/supabase-js';

async function getNotionToken(userId: string): Promise<string | null> {
  if (!userId) {
    console.error('No userId provided to getNotionToken');
    return null;
  }

  try {
    console.log('Getting Notion token for user:', userId);

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials');
      return null;
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabaseAdmin
      .from('integrations')
      .select('access_token, is_active')
      .eq('user_id', userId)
      .eq('provider', 'notion')
      .maybeSingle();

    if (error) {
      console.error('Error querying integrations:', error);
      return null;
    }

    if (!data) {
      console.error('No Notion integration found for userId:', userId);
      console.log('User needs to connect Notion.');
      return null;
    }

    if (!data.is_active || !data.access_token) {
      console.error('User has no active Notion token saved. is_active:', data.is_active);
      return null;
    }

    console.log('Found Notion token for user');
    return data.access_token;
  } catch (error) {
    console.error('Error getting Notion token:', error);
    return null;
  }
}

export async function listNotionRootPages(userId: string): Promise<any[]> {
  const token = await getNotionToken(userId);
  if (!token) return [];

  try {
    // Search with empty query to get all pages
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '',
        page_size: 100,
      }),
    });

    if (!response.ok) {
      console.error('Notion search failed:', response.status);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error listing Notion pages:', error);
    return [];
  }
}

function fuzzyMatch(query: string, text: string): number {
  // Simple fuzzy matching score
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  if (t.includes(q)) return 100;

  let score = 0;
  let qIdx = 0;

  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      score += 1;
      qIdx++;
    }
  }

  return qIdx === q.length ? score : 0;
}

export async function searchNotionPages(userId: string, query: string): Promise<any[]> {
  const token = await getNotionToken(userId);
  if (!token) return [];

  try {
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query.split(' ')[0], // Search by first word
        filter: {
          value: 'page',
          property: 'object',
        },
      }),
    });

    if (!response.ok) {
      console.error('Notion search failed:', response.status);
      return [];
    }

    const data = await response.json();

    // Sort by fuzzy match score
    const results = (data.results || []).sort((a: any, b: any) => {
      const aTitle = a.properties?.title?.[0]?.plain_text || a.title?.[0]?.plain_text || '';
      const bTitle = b.properties?.title?.[0]?.plain_text || b.title?.[0]?.plain_text || '';

      const aScore = fuzzyMatch(query, aTitle);
      const bScore = fuzzyMatch(query, bTitle);

      return bScore - aScore;
    });

    return results;
  } catch (error) {
    console.error('Error searching Notion:', error);
    return [];
  }
}

export async function getNotionDatabase(userId: string, databaseId: string): Promise<any[]> {
  const token = await getNotionToken(userId);
  if (!token) return [];

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_size: 100,
      }),
    });

    if (!response.ok) {
      console.error('Notion database query failed:', response.status);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error querying Notion database:', error);
    return [];
  }
}

export async function createNotionPage(
  userId: string,
  parentId: string,
  title: string,
  properties?: Record<string, any>
): Promise<any> {
  const token = await getNotionToken(userId);
  if (!token) throw new Error('No Notion token');

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: {
          database_id: parentId,
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: title,
                },
              },
            ],
          },
          ...properties,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Notion create failed:', error);
      throw new Error(error.message || 'Failed to create page');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Notion page:', error);
    throw error;
  }
}

export async function updateNotionPage(
  userId: string,
  pageId: string,
  properties: Record<string, any>
): Promise<any> {
  const token = await getNotionToken(userId);
  if (!token) throw new Error('No Notion token');

  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Notion update failed:', error);
      throw new Error(error.message || 'Failed to update page');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating Notion page:', error);
    throw error;
  }
}

export async function deleteNotionPage(userId: string, pageId: string): Promise<boolean> {
  const token = await getNotionToken(userId);
  if (!token) throw new Error('No Notion token');

  try {
    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Notion delete failed:', error);
      throw new Error(error.message || 'Failed to delete page');
    }

    return true;
  } catch (error) {
    console.error('Error deleting Notion page:', error);
    throw error;
  }
}

export async function navigateNotionPath(
  userId: string,
  pathArray: string[]
): Promise<{ id: string; title: string } | null> {
  const token = await getNotionToken(userId);
  if (!token) {
    console.error('No Notion token');
    return null;
  }

  try {
    // First, search for the root page
    console.log('Searching for root page:', pathArray[0]);
    const searchResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: pathArray[0].split(' ')[0], // Search by first word for better results
      }),
    });

    if (!searchResponse.ok) {
      console.error('Search failed:', searchResponse.status);
      return null;
    }

    const searchData = await searchResponse.json();
    if (!searchData.results || searchData.results.length === 0) {
      console.error('No results found for:', pathArray[0]);
      return null;
    }

    // Find best match for root page
    const extractTitle = (obj: any): string => {
      // Try to extract title from various possible structures in Notion API response
      const attempts = [
        // Standard page structure
        obj.properties?.title?.[0]?.plain_text,
        // String title
        (typeof obj.title === 'string' ? obj.title : null),
        // Array title
        obj.title?.[0]?.plain_text,
        // Child page structure
        obj.child_page?.title,
        // Child database structure
        obj.child_database?.title,
        // Sometimes title is in a different property structure
        obj.properties?.name?.[0]?.plain_text,
        // Try raw property access
        obj.properties?.title?.[0]?.text?.content,
      ];

      const title = attempts.find(t => typeof t === 'string' && t.trim());
      return title || '';
    };

    const rootMatch = searchData.results.find((result: any) => {
      const title = extractTitle(result);
      return title && title.toLowerCase().includes(pathArray[0].toLowerCase());
    }) || searchData.results[0];

    let currentId = rootMatch.id;
    let currentTitle = extractTitle(rootMatch);

    console.log('Found root page:', {
      id: currentId,
      title: currentTitle || 'NO TITLE',
      properties: Object.keys(rootMatch.properties || {}),
      hasChildPage: !!rootMatch.child_page,
      hasChildDatabase: !!rootMatch.child_database,
      rawTitle: rootMatch.title,
      rawProperties: rootMatch.properties?.title
    });

    // Navigate through the path
    for (let i = 1; i < pathArray.length; i++) {
      const searchTerm = pathArray[i].toLowerCase();
      console.log(`Navigating to: ${searchTerm}`);

      // Get children of current page
      const childrenResponse = await fetch(
        `https://api.notion.com/v1/blocks/${currentId}/children?page_size=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Notion-Version': '2022-06-28',
          },
        }
      );

      if (!childrenResponse.ok) {
        console.error('Failed to get children for:', currentId);
        return null;
      }

      const childrenData = await childrenResponse.json();
      if (!childrenData.results || childrenData.results.length === 0) {
        console.error('No children found for:', currentId);
        return null;
      }

      console.log(`Found ${childrenData.results.length} children`);

      // Find the matching child with fuzzy match
      let matchingChild = null;
      let bestScore = 0;

      for (const child of childrenData.results) {
        const childTitle = (
          child.child_database?.title ||
          child.child_page?.title ||
          child.properties?.title?.[0]?.plain_text ||
          ''
        ).toLowerCase();

        if (!childTitle) continue;

        // Exact match
        if (childTitle === searchTerm) {
          matchingChild = child;
          bestScore = 100;
          break;
        }

        // Includes match
        if (childTitle.includes(searchTerm) || searchTerm.includes(childTitle)) {
          const score = Math.max(
            childTitle.includes(searchTerm) ? 80 : 0,
            searchTerm.includes(childTitle) ? 80 : 0
          );
          if (score > bestScore) {
            bestScore = score;
            matchingChild = child;
          }
        }

        // Fuzzy match
        if (bestScore < 70) {
          let fuzzyScore = 0;
          let searchIdx = 0;
          for (let j = 0; j < childTitle.length && searchIdx < searchTerm.length; j++) {
            if (childTitle[j] === searchTerm[searchIdx]) {
              fuzzyScore++;
              searchIdx++;
            }
          }
          if (searchIdx === searchTerm.length && fuzzyScore > bestScore) {
            bestScore = fuzzyScore;
            matchingChild = child;
          }
        }
      }

      if (!matchingChild) {
        console.error(`Could not find child matching: ${searchTerm}`);
        console.log('Available children:', childrenData.results.map((c: any) => ({
          title: extractTitle(c) || 'untitled',
          id: c.id,
        })));
        return null;
      }

      currentId = matchingChild.id;
      currentTitle = extractTitle(matchingChild) || 'Untitled';

      console.log(`Found: ${currentTitle} (${currentId})`);
    }

    // Ensure we always return a meaningful title
    const finalTitle = currentTitle?.trim() ? currentTitle : 'Untitled';
    console.log('Returning from navigateNotionPath:', { id: currentId, title: finalTitle });
    return { id: currentId, title: finalTitle };
  } catch (error) {
    console.error('Error navigating Notion path:', error);
    return null;
  }
}

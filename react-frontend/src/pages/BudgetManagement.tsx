import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, Plus, Eye, BarChart3, Calendar, Mail, MapPin, Star, Brain, Target, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";
import { useAppStore } from '../store/useAppStore';
import PlanningJourney from '../components/PlanningJourney';

interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color: string;
  icon: React.ReactNode;
  eventId?: string;
  vendors?: ShortlistedVendor[];
  isEventBased?: boolean;
}

interface Transaction {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
}

interface ShortlistedVendor {
  id: string;
  name: string;
  category: string;
  quotedAmount: number;
  originalPrice: number;
  discount: number;
  aiRating: number;
  status: 'shortlisted' | 'selected' | 'rejected';
  marketPosition: 'below' | 'average' | 'above';
  confidence: number;
  paymentTerms: string;
  advanceRequired: number;
}

const BudgetManagement: React.FC = () => {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      category: 'Venue',
      description: 'Deposit for Palace Gardens',
      amount: 5000,
      date: '2025-01-15',
      type: 'expense'
    },
    {
      id: '2',
      category: 'Catering',
      description: 'Menu tasting session',
      amount: 200,
      date: '2025-01-20',
      type: 'expense'
    },
    {
      id: '3',
      category: 'Photography',
      description: 'Engagement shoot',
      amount: 1500,
      date: '2025-01-25',
      type: 'expense'
    }
  ]);

  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id' | 'date'>>({
    category: '',
    description: '',
    amount: 0,
    type: 'expense'
  });
  const [shortlistedVendors, setShortlistedVendors] = useState<ShortlistedVendor[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [weddingPreferences, setWeddingPreferences] = useState<any>(null);
  const [vendorTab, setVendorTab] = useState('all-vendors');
  const [vendorCategories, setVendorCategories] = useState<string[]>([]);
  const [blueprintData, setBlueprintData] = useState<any>(null);
  const [blueprintLoaded, setBlueprintLoaded] = useState(false);

  // Read blueprintId from the global store
  const storeBlueprintId = useAppStore((state) => state.blueprintId);
  const storeWeddingPreferences = useAppStore((state) => state.weddingPreferences);

  // Dynamic category generation based on selected events and preferences
  const generateDynamicCategories = (events: string[], preferences: any): BudgetCategory[] => {
    const eventCategoryMapping: { [key: string]: { name: string; icon: React.ReactNode; color: string; baseAmount: number } } = {
      // Pre-wedding events
      'tilak-ceremony': { name: 'Tilak/Roka Ceremony', icon: <Calendar className="h-4 w-4 text-white" />, color: '#8B5CF6', baseAmount: 15000 },
      'ring-ceremony': { name: 'Ring Ceremony', icon: <Star className="h-4 w-4 text-white" />, color: '#06B6D4', baseAmount: 25000 },
      'mehendi': { name: 'Mehendi Ceremony', icon: <Star className="h-4 w-4 text-white" />, color: '#10B981', baseAmount: 30000 },
      'sangeet': { name: 'Sangeet Night', icon: <Calendar className="h-4 w-4 text-white" />, color: '#F59E0B', baseAmount: 40000 },
      'haldi': { name: 'Haldi Ceremony', icon: <Star className="h-4 w-4 text-white" />, color: '#EF4444', baseAmount: 20000 },
      'chooda-ceremony': { name: 'Chooda Ceremony', icon: <Calendar className="h-4 w-4 text-white" />, color: '#8B5CF6', baseAmount: 10000 },
      
      // Main wedding events
      'ganesh-puja': { name: 'Ganesh Puja', icon: <Star className="h-4 w-4 text-white" />, color: '#06B6D4', baseAmount: 5000 },
      'baraat': { name: 'Baraat Procession', icon: <Calendar className="h-4 w-4 text-white" />, color: '#10B981', baseAmount: 35000 },
      'jaimala': { name: 'Jaimala/Varmala', icon: <Star className="h-4 w-4 text-white" />, color: '#F59E0B', baseAmount: 8000 },
      'mandap-ceremony': { name: 'Main Wedding Ceremony', icon: <Calendar className="h-4 w-4 text-white" />, color: '#EF4444', baseAmount: 80000 },
      'saptapadi': { name: 'Saptapadi (Seven Pheras)', icon: <Star className="h-4 w-4 text-white" />, color: '#8B5CF6', baseAmount: 15000 },
      'sindoor-ceremony': { name: 'Sindoor & Mangalsutra', icon: <Calendar className="h-4 w-4 text-white" />, color: '#06B6D4', baseAmount: 5000 },
      'kanya-daan': { name: 'Kanya Daan', icon: <Star className="h-4 w-4 text-white" />, color: '#10B981', baseAmount: 8000 },
      
      // Post-wedding events
      'bidaai': { name: 'Bidaai Ceremony', icon: <Calendar className="h-4 w-4 text-white" />, color: '#F59E0B', baseAmount: 10000 },
      'ghar-pravesh': { name: 'Ghar Pravesh', icon: <Star className="h-4 w-4 text-white" />, color: '#EF4444', baseAmount: 15000 },
      'reception': { name: 'Wedding Reception', icon: <Calendar className="h-4 w-4 text-white" />, color: '#8B5CF6', baseAmount: 60000 },
      'muh-dikhai': { name: 'Muh Dikhai', icon: <Star className="h-4 w-4 text-white" />, color: '#06B6D4', baseAmount: 12000 },
      'aashirwad': { name: 'Aashirwad Ceremony', icon: <Calendar className="h-4 w-4 text-white" />, color: '#10B981', baseAmount: 8000 },
      
      // Optional events
      'cocktail-party': { name: 'Cocktail Party', icon: <Star className="h-4 w-4 text-white" />, color: '#F59E0B', baseAmount: 45000 },
      'bachelor-party': { name: 'Bachelor/Bachelorette', icon: <Calendar className="h-4 w-4 text-white" />, color: '#EF4444', baseAmount: 25000 },
      'prewedding-shoot': { name: 'Pre-Wedding Photoshoot', icon: <Star className="h-4 w-4 text-white" />, color: '#8B5CF6', baseAmount: 20000 }
    };

    const vendorCategoryMapping: { [key: string]: { name: string; icon: React.ReactNode; color: string; baseAmount: number } } = {
      'venue': { name: 'Venue & Location', icon: <MapPin className="h-4 w-4 text-white" />, color: '#3B82F6', baseAmount: 150000 },
      'catering': { name: 'Catering & Food', icon: <DollarSign className="h-4 w-4 text-white" />, color: '#10B981', baseAmount: 100000 },
      'photography': { name: 'Photography & Videography', icon: <Eye className="h-4 w-4 text-white" />, color: '#F59E0B', baseAmount: 60000 },
      'decoration': { name: 'Decoration & Flowers', icon: <Star className="h-4 w-4 text-white" />, color: '#EF4444', baseAmount: 40000 },
      'entertainment': { name: 'Music & Entertainment', icon: <Calendar className="h-4 w-4 text-white" />, color: '#8B5CF6', baseAmount: 35000 },
      'transport': { name: 'Transportation', icon: <MapPin className="h-4 w-4 text-white" />, color: '#06B6D4', baseAmount: 25000 },
      'makeup': { name: 'Makeup & Beauty', icon: <Star className="h-4 w-4 text-white" />, color: '#EC4899', baseAmount: 30000 },
      'attire': { name: 'Wedding Attire', icon: <DollarSign className="h-4 w-4 text-white" />, color: '#14B8A6', baseAmount: 50000 },
      'jewelry': { name: 'Jewelry & Accessories', icon: <Star className="h-4 w-4 text-white" />, color: '#F97316', baseAmount: 75000 },
      'invitation': { name: 'Invitations & Stationery', icon: <Mail className="h-4 w-4 text-white" />, color: '#84CC16', baseAmount: 15000 }
    };

    let dynamicCategories: BudgetCategory[] = [];
    let categoryId = 1;

    // Add event-based categories
    events.forEach(eventId => {
      const eventConfig = eventCategoryMapping[eventId];
      if (eventConfig) {
        const guestCount = preferences?.basicDetails?.guestCount || 100;
        const budgetMultiplier = guestCount <= 50 ? 0.6 : guestCount <= 100 ? 1 : guestCount <= 200 ? 1.5 : 2;
        
        dynamicCategories.push({
          id: `event-${categoryId++}`,
          name: eventConfig.name,
          allocated: Math.round(eventConfig.baseAmount * budgetMultiplier),
          spent: Math.round(eventConfig.baseAmount * budgetMultiplier * Math.random() * 0.3), // Random spending simulation
          color: eventConfig.color,
          icon: eventConfig.icon,
          eventId: eventId,
          isEventBased: true
        });
      }
    });

    // Add vendor/service categories based on preferences
    
    // Add categories based on user preferences
    if (preferences?.venue?.venueType) {
      const venueConfig = vendorCategoryMapping['venue'];
      const guestCount = preferences?.basicDetails?.guestCount || 100;
      const budgetMultiplier = guestCount <= 50 ? 0.7 : guestCount <= 100 ? 1 : guestCount <= 200 ? 1.4 : 1.8;
      
      dynamicCategories.push({
        id: `vendor-${categoryId++}`,
        name: venueConfig.name,
        allocated: Math.round(venueConfig.baseAmount * budgetMultiplier),
        spent: 0,
        color: venueConfig.color,
        icon: venueConfig.icon,
        isEventBased: false
      });
    }

    if (preferences?.catering?.cuisine) {
      const cateringConfig = vendorCategoryMapping['catering'];
      const guestCount = preferences?.basicDetails?.guestCount || 100;
      const perPersonBudget = preferences?.catering?.budgetPerPerson ? parseInt(preferences.catering.budgetPerPerson) : 1000;
      
      dynamicCategories.push({
        id: `vendor-${categoryId++}`,
        name: cateringConfig.name,
        allocated: guestCount * perPersonBudget,
        spent: 0,
        color: cateringConfig.color,
        icon: cateringConfig.icon,
        isEventBased: false
      });
    }

    if (preferences?.photography?.style) {
      const photoConfig = vendorCategoryMapping['photography'];
      const coverageMultiplier = Object.values(preferences.photography.multiDayCoverage || {}).filter(Boolean).length || 1;
      
      dynamicCategories.push({
        id: `vendor-${categoryId++}`,
        name: photoConfig.name,
        allocated: Math.round(photoConfig.baseAmount * coverageMultiplier),
        spent: 0,
        color: photoConfig.color,
        icon: photoConfig.icon,
        isEventBased: false
      });
    }

    if (preferences?.theme?.selectedTheme) {
      const decorConfig = vendorCategoryMapping['decoration'];
      dynamicCategories.push({
        id: `vendor-${categoryId++}`,
        name: decorConfig.name,
        allocated: decorConfig.baseAmount,
        spent: 0,
        color: decorConfig.color,
        icon: decorConfig.icon,
        isEventBased: false
      });
    }

    // Add other essential categories
    ['entertainment', 'transport', 'makeup', 'attire', 'jewelry', 'invitation'].forEach(vendorType => {
      const config = vendorCategoryMapping[vendorType];
      if (config) {
        dynamicCategories.push({
          id: `vendor-${categoryId++}`,
          name: config.name,
          allocated: config.baseAmount,
          spent: 0,
          color: config.color,
          icon: config.icon,
          isEventBased: false
        });
      }
    });

    return dynamicCategories;
  };

  useEffect(() => {
    loadShortlistedVendors();
    loadWeddingPreferences();
  }, []);

  // Fetch blueprint data if blueprintId exists in the store
  useEffect(() => {
    if (!storeBlueprintId) return;

    const fetchBlueprint = async () => {
      try {
        const response = await fetch(`/api/blueprint/${storeBlueprintId}`);
        if (!response.ok) throw new Error('Failed to fetch blueprint');
        const data = await response.json();
        setBlueprintData(data);
        setBlueprintLoaded(true);

        // Build budget categories from blueprint's budget_breakdown
        if (data.budget_breakdown) {
          const colorMap: Record<string, string> = {
            venue: '#3B82F6', photography: '#F59E0B', catering: '#10B981',
            decoration: '#EF4444', makeup: '#EC4899', entertainment: '#8B5CF6',
            transport: '#06B6D4', attire: '#14B8A6', jewelry: '#F97316',
            invitation: '#84CC16',
          };
          const iconMap: Record<string, React.ReactNode> = {
            venue: <MapPin className="h-4 w-4 text-white" />,
            photography: <Eye className="h-4 w-4 text-white" />,
            catering: <DollarSign className="h-4 w-4 text-white" />,
            decoration: <Star className="h-4 w-4 text-white" />,
            makeup: <Star className="h-4 w-4 text-white" />,
            entertainment: <Calendar className="h-4 w-4 text-white" />,
          };
          const nameMap: Record<string, string> = {
            venue: 'Venue & Location', photography: 'Photography & Videography',
            catering: 'Catering & Food', decoration: 'Decoration & Flowers',
            makeup: 'Makeup & Beauty', entertainment: 'Music & Entertainment',
            transport: 'Transportation', attire: 'Wedding Attire',
            jewelry: 'Jewelry & Accessories', invitation: 'Invitations & Stationery',
          };

          const blueprintCategories: BudgetCategory[] = Object.entries(data.budget_breakdown).map(
            ([key, amount], idx) => ({
              id: `bp-${idx + 1}`,
              name: nameMap[key] || key.charAt(0).toUpperCase() + key.slice(1),
              allocated: amount as number,
              spent: 0,
              color: colorMap[key] || '#6B7280',
              icon: iconMap[key] || <DollarSign className="h-4 w-4 text-white" />,
              isEventBased: false,
            })
          );
          setCategories(blueprintCategories);
        }
      } catch (error) {
        console.error('Error fetching blueprint:', error);
        // Fall back to existing behavior — categories stay as-is
      }
    };

    fetchBlueprint();
  }, [storeBlueprintId]);

  useEffect(() => {
    if (weddingPreferences && selectedEvents.length > 0) {
      const dynamicCategories = generateDynamicCategories(selectedEvents, weddingPreferences);
      setCategories(dynamicCategories);
    }
  }, [selectedEvents, weddingPreferences]);

  const loadWeddingPreferences = () => {
    try {
      const storedPreferences = localStorage.getItem('weddingPreferences');
      if (storedPreferences) {
        const preferences = JSON.parse(storedPreferences);
        setWeddingPreferences(preferences);
        setSelectedEvents(preferences.events?.selectedEvents || []);
      } else {
        // Create sample preferences if none exist
        const samplePreferences = {
          basicDetails: {
            guestCount: 150,
            budgetRange: '20-50 lakhs',
            eventDuration: '3'
          },
          events: {
            selectedEvents: ['mehendi', 'sangeet', 'haldi', 'mandap-ceremony', 'reception']
          },
          venue: { venueType: 'banquet-hall' },
          catering: { cuisine: 'North Indian', budgetPerPerson: '1200' },
          photography: { style: 'traditional', multiDayCoverage: { mehendi: true, sangeet: true, wedding: true } },
          theme: { selectedTheme: 'royal-traditional' }
        };
        setWeddingPreferences(samplePreferences);
        setSelectedEvents(samplePreferences.events.selectedEvents);
      }
    } catch (error) {
      console.error('Error loading wedding preferences:', error);
    }
  };

  const loadShortlistedVendors = () => {
    // Load shortlisted vendors from vendor communication
    const savedCommunications = localStorage.getItem('vendorCommunications');
    if (savedCommunications) {
      const communications = JSON.parse(savedCommunications);
      const shortlisted = communications
        .filter((comm: any) => comm.status === 'quoted' || comm.status === 'negotiating' || comm.status === 'booked')
        .map((comm: any) => ({
          id: comm.id,
          name: comm.vendorName,
          category: comm.vendorCategory,
          quotedAmount: comm.quotation?.amount || 0,
          originalPrice: (comm.quotation?.amount || 0) + (comm.priceReductions || 0),
          discount: comm.priceReductions || 0,
          aiRating: comm.aiAnalysis?.overallRating || 0,
          status: comm.status === 'booked' ? 'selected' : 'shortlisted',
          marketPosition: comm.aiAnalysis?.marketComparison?.priceVsMarket || 'average',
          confidence: comm.aiAnalysis?.recommendations?.confidence || 0,
          paymentTerms: comm.quotation?.paymentTerms || '',
          advanceRequired: comm.quotation?.advances?.[0]?.amount || 0
        }));
      setShortlistedVendors(shortlisted);
      
      // Extract unique vendor categories for tabs
      const categories = Array.from(new Set(shortlisted.map((vendor: ShortlistedVendor) => vendor.category))) as string[];
      setVendorCategories(categories);
    } else {
      // Generate comprehensive sample data with all vendor categories
      const sampleVendors: ShortlistedVendor[] = [
        // Core Venue & Location
        {
          id: 'v1',
          name: 'Royal Garden Palace',
          category: 'Venue',
          quotedAmount: 250000,
          originalPrice: 280000,
          discount: 30000,
          aiRating: 4.5,
          status: 'shortlisted',
          marketPosition: 'below',
          confidence: 85,
          paymentTerms: '30% advance, 50% 30 days before, 20% on event day',
          advanceRequired: 75000
        },

        // Photography & Videography
        {
          id: 'v2',
          name: 'Elite Photography Studio',
          category: 'Photography',
          quotedAmount: 120000,
          originalPrice: 120000,
          discount: 0,
          aiRating: 4.7,
          status: 'selected',
          marketPosition: 'average',
          confidence: 92,
          paymentTerms: '50% advance, 50% on completion',
          advanceRequired: 60000
        },
        {
          id: 'v3',
          name: 'Cinematic Wedding Films',
          category: 'Videography',
          quotedAmount: 95000,
          originalPrice: 110000,
          discount: 15000,
          aiRating: 4.6,
          status: 'shortlisted',
          marketPosition: 'below',
          confidence: 88,
          paymentTerms: '40% advance, 60% on completion',
          advanceRequired: 38000
        },

        // Food & Catering
        {
          id: 'v4',
          name: 'Gourmet Catering Co.',
          category: 'Catering',
          quotedAmount: 180000,
          originalPrice: 200000,
          discount: 20000,
          aiRating: 4.3,
          status: 'shortlisted',
          marketPosition: 'below',
          confidence: 78,
          paymentTerms: '40% advance, 60% on event day',
          advanceRequired: 72000
        },
        {
          id: 'v5',
          name: 'Sweet Dreams Cake Studio',
          category: 'Cake & Desserts',
          quotedAmount: 15000,
          originalPrice: 18000,
          discount: 3000,
          aiRating: 4.4,
          status: 'selected',
          marketPosition: 'average',
          confidence: 85,
          paymentTerms: '50% advance, 50% on delivery',
          advanceRequired: 7500
        },

        // Decoration & Flowers
        {
          id: 'v6',
          name: 'Elegant Decorations',
          category: 'Decoration',
          quotedAmount: 85000,
          originalPrice: 95000,
          discount: 10000,
          aiRating: 4.2,
          status: 'shortlisted',
          marketPosition: 'average',
          confidence: 82,
          paymentTerms: '50% advance, 50% on event day',
          advanceRequired: 42500
        },
        {
          id: 'v7',
          name: 'Blooming Petals Florist',
          category: 'Florals',
          quotedAmount: 35000,
          originalPrice: 40000,
          discount: 5000,
          aiRating: 4.5,
          status: 'shortlisted',
          marketPosition: 'below',
          confidence: 87,
          paymentTerms: '30% advance, 70% on delivery',
          advanceRequired: 10500
        },

        // Entertainment & Music
        {
          id: 'v8',
          name: 'Melody Wedding Band',
          category: 'Entertainment',
          quotedAmount: 45000,
          originalPrice: 45000,
          discount: 0,
          aiRating: 4.6,
          status: 'selected',
          marketPosition: 'average',
          confidence: 88,
          paymentTerms: '30% advance, 70% on event day',
          advanceRequired: 13500
        },
        {
          id: 'v9',
          name: 'DJ Beats & Lights',
          category: 'DJ Services',
          quotedAmount: 25000,
          originalPrice: 28000,
          discount: 3000,
          aiRating: 4.1,
          status: 'shortlisted',
          marketPosition: 'below',
          confidence: 75,
          paymentTerms: '50% advance, 50% on event day',
          advanceRequired: 12500
        },

        // Beauty & Wellness
        {
          id: 'v10',
          name: 'Glamour Makeup Studio',
          category: 'Makeup & Hair',
          quotedAmount: 18000,
          originalPrice: 20000,
          discount: 2000,
          aiRating: 4.3,
          status: 'selected',
          marketPosition: 'below',
          confidence: 80,
          paymentTerms: '30% advance, 70% on event day',
          advanceRequired: 5400
        },
        {
          id: 'v11',
          name: 'Bridal Spa & Wellness',
          category: 'Beauty Services',
          quotedAmount: 12000,
          originalPrice: 12000,
          discount: 0,
          aiRating: 4.4,
          status: 'shortlisted',
          marketPosition: 'average',
          confidence: 85,
          paymentTerms: '100% advance booking',
          advanceRequired: 12000
        },

        // Attire & Fashion
        {
          id: 'v12',
          name: 'Royal Attire Collection',
          category: 'Bridal Wear',
          quotedAmount: 75000,
          originalPrice: 85000,
          discount: 10000,
          aiRating: 4.5,
          status: 'shortlisted',
          marketPosition: 'below',
          confidence: 88,
          paymentTerms: '50% advance, 50% on delivery',
          advanceRequired: 37500
        },
        {
          id: 'v13',
          name: 'Gentleman\'s Wedding Suits',
          category: 'Groom Wear',
          quotedAmount: 35000,
          originalPrice: 40000,
          discount: 5000,
          aiRating: 4.2,
          status: 'shortlisted',
          marketPosition: 'below',
          confidence: 82,
          paymentTerms: '40% advance, 60% on delivery',
          advanceRequired: 14000
        },

        // Jewelry & Accessories
        {
          id: 'v14',
          name: 'Diamond Dreams Jewelers',
          category: 'Wedding Jewelry',
          quotedAmount: 85000,
          originalPrice: 90000,
          discount: 5000,
          aiRating: 4.6,
          status: 'selected',
          marketPosition: 'average',
          confidence: 90,
          paymentTerms: '60% advance, 40% on delivery',
          advanceRequired: 51000
        },

        // Transportation
        {
          id: 'v15',
          name: 'Luxury Transport Services',
          category: 'Transportation',
          quotedAmount: 25000,
          originalPrice: 28000,
          discount: 3000,
          aiRating: 4.1,
          status: 'shortlisted',
          marketPosition: 'below',
          confidence: 75,
          paymentTerms: '100% on event day',
          advanceRequired: 0
        },

        // Stationery & Invitations
        {
          id: 'v16',
          name: 'Creative Cards & Invites',
          category: 'Stationery',
          quotedAmount: 8000,
          originalPrice: 10000,
          discount: 2000,
          aiRating: 4.3,
          status: 'selected',
          marketPosition: 'below',
          confidence: 85,
          paymentTerms: '50% advance, 50% on delivery',
          advanceRequired: 4000
        },

        // Event Planning & Coordination
        {
          id: 'v17',
          name: 'Perfect Day Wedding Planners',
          category: 'Wedding Planner',
          quotedAmount: 65000,
          originalPrice: 70000,
          discount: 5000,
          aiRating: 4.7,
          status: 'shortlisted',
          marketPosition: 'average',
          confidence: 92,
          paymentTerms: '30% advance, 50% month before, 20% on completion',
          advanceRequired: 19500
        },

        // Religious & Ceremony
        {
          id: 'v18',
          name: 'Pandit Sharma Wedding Services',
          category: 'Officiant',
          quotedAmount: 5000,
          originalPrice: 5000,
          discount: 0,
          aiRating: 4.8,
          status: 'selected',
          marketPosition: 'average',
          confidence: 95,
          paymentTerms: '100% on event day',
          advanceRequired: 0
        },

        // Equipment & Rentals
        {
          id: 'v19',
          name: 'Elite Event Rentals',
          category: 'Rentals',
          quotedAmount: 22000,
          originalPrice: 25000,
          discount: 3000,
          aiRating: 4.2,
          status: 'shortlisted',
          marketPosition: 'below',
          confidence: 80,
          paymentTerms: '50% advance, 50% on event day',
          advanceRequired: 11000
        },

        // Lighting & Audio Visual
        {
          id: 'v20',
          name: 'Brilliant Lighting Solutions',
          category: 'Lighting',
          quotedAmount: 28000,
          originalPrice: 32000,
          discount: 4000,
          aiRating: 4.4,
          status: 'shortlisted',
          marketPosition: 'below',
          confidence: 85,
          paymentTerms: '40% advance, 60% on event day',
          advanceRequired: 11200
        },

        // Guest Services
        {
          id: 'v21',
          name: 'Royal Guest Accommodations',
          category: 'Accommodations',
          quotedAmount: 45000,
          originalPrice: 50000,
          discount: 5000,
          aiRating: 4.3,
          status: 'shortlisted',
          marketPosition: 'below',
          confidence: 82,
          paymentTerms: 'Pay per guest arrival',
          advanceRequired: 15000
        },

        // Favors & Gifts
        {
          id: 'v22',
          name: 'Memorable Wedding Favors',
          category: 'Wedding Favors',
          quotedAmount: 12000,
          originalPrice: 14000,
          discount: 2000,
          aiRating: 4.1,
          status: 'shortlisted',
          marketPosition: 'below',
          confidence: 75,
          paymentTerms: '100% advance',
          advanceRequired: 12000
        },

        // Indian Wedding Specific
        {
          id: 'v23',
          name: 'Traditional Mehndi Artists',
          category: 'Mehndi Artist',
          quotedAmount: 8000,
          originalPrice: 9000,
          discount: 1000,
          aiRating: 4.5,
          status: 'selected',
          marketPosition: 'below',
          confidence: 88,
          paymentTerms: '30% advance, 70% on event day',
          advanceRequired: 2400
        },
        {
          id: 'v24',
          name: 'Royal Horse & Carriage',
          category: 'Baraat Services',
          quotedAmount: 15000,
          originalPrice: 18000,
          discount: 3000,
          aiRating: 4.2,
          status: 'shortlisted',
          marketPosition: 'below',
          confidence: 80,
          paymentTerms: '50% advance, 50% on event day',
          advanceRequired: 7500
        }
      ];
      setShortlistedVendors(sampleVendors);
      
      // Extract unique vendor categories for tabs from sample data
      const categories = Array.from(new Set(sampleVendors.map(vendor => vendor.category)));
      setVendorCategories(categories);
    }
  };

  // Use blueprint budget_breakdown total if available, otherwise fallback to hardcoded
  const totalBudget = blueprintData?.budget_breakdown
    ? Object.values(blueprintData.budget_breakdown as Record<string, number>).reduce((sum: number, v: number) => sum + v, 0)
    : 1200000;
  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate projected spending based on shortlisted vendors
  const projectedVendorCosts = shortlistedVendors
    .filter(v => v.status === 'shortlisted' || v.status === 'selected')
    .reduce((sum, v) => sum + v.quotedAmount, 0);
  
  const totalProjectedSpending = totalSpent + projectedVendorCosts;
  const remainingBudget = totalBudget - totalProjectedSpending;
  const budgetUtilization = (totalProjectedSpending / totalBudget) * 100;

  const addTransaction = () => {
    if (newTransaction.category && newTransaction.description && newTransaction.amount > 0) {
      const transaction: Transaction = {
        ...newTransaction,
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0]
      };
      setTransactions([transaction, ...transactions]);
      setNewTransaction({ category: '', description: '', amount: 0, type: 'expense' });
      setShowAddTransaction(false);
    }
  };

  const getCategoryProgress = (category: BudgetCategory) => {
    return (category.spent / category.allocated) * 100;
  };

  // Removed unused functions for cleaner code

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Planning Journey */}
          <PlanningJourney compact />

          {/* Header */}
          <div className="bg-white rounded-2xl p-8 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#133337' }}>
                  <BarChart3 className="h-6 w-6" style={{ color: '#FFFFFF' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#133337' }}>Budget Management</h1>
                  <p className="text-gray-600">Track and manage your wedding expenses</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTransaction(true)}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 hover:opacity-90"
                style={{ backgroundColor: '#df8e8e', color: '#FFFFFF' }}
              >
                <Plus className="h-4 w-4" />
                <span>Add Transaction</span>
              </button>
            </div>
          </div>

          {/* Blueprint sync banner */}
          {blueprintLoaded && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-800">
                Budget synced from your AI Wedding Blueprint
              </p>
            </div>
          )}

          {/* Budget Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Budget Card */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalBudget.toLocaleString()}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <Eye className="h-4 w-4" />
                <span>Set for your wedding date</span>
              </div>
            </div>

            {/* Spent Amount Card */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-rose-100 p-3 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-rose-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <div className="w-2 h-2 rounded-full bg-rose-600"></div>
                <span>{budgetUtilization.toFixed(1)}% of budget used</span>
              </div>
            </div>

            {/* Remaining Budget Card */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">₹{remainingBudget.toLocaleString()}</p>
                </div>
                <div className="bg-sage-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-sage-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <div className="w-2 h-2 rounded-full bg-sage-600"></div>
                <span>{(100 - budgetUtilization).toFixed(1)}% remaining</span>
              </div>
            </div>
          </div>

          {/* Dynamic Budget Sections */}
          <div className="space-y-6">
            {/* Event-Based Budget Section */}
            {categories.filter(cat => cat.isEventBased).length > 0 && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-100 p-3 rounded-lg">
                      <Calendar className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Event Budgets</h2>
                      <p className="text-sm text-gray-600">Budget allocation for your selected wedding events</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.filter(cat => cat.isEventBased).map((category) => (
                      <div key={category.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: category.color }}>
                              {category.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{category.name}</h4>
                              <p className="text-sm text-gray-600">
                                ₹{category.spent.toLocaleString()} / ₹{category.allocated.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">
                              {getCategoryProgress(category).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {weddingPreferences?.basicDetails?.guestCount} guests
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(getCategoryProgress(category), 100)}%`,
                              backgroundColor: category.color
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Vendor Services Budget Section */}
            {categories.filter(cat => !cat.isEventBased).length > 0 && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Vendor & Service Budgets</h2>
                      <p className="text-sm text-gray-600">Budget allocation for vendors and wedding services</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.filter(cat => !cat.isEventBased).map((category) => (
                      <div key={category.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: category.color }}>
                              {category.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{category.name}</h4>
                              <p className="text-sm text-gray-600">
                                ₹{category.spent.toLocaleString()} / ₹{category.allocated.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">
                              {getCategoryProgress(category).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(getCategoryProgress(category), 100)}%`,
                              backgroundColor: category.color
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Vendor-wise Budget Breakdown */}
            {shortlistedVendors.length > 0 && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-100 p-3 rounded-lg">
                      <DollarSign className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Vendor Budget Breakdown</h2>
                      <p className="text-sm text-gray-600">Detailed budget analysis by vendor categories</p>
                    </div>
                  </div>
                </div>

                {/* Vendor Category Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex overflow-x-auto">
                    <button
                      onClick={() => setVendorTab('all-vendors')}
                      className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                        vendorTab === 'all-vendors'
                          ? 'border-rose-500 text-rose-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      All vendors
                    </button>
                    {vendorCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setVendorTab(category)}
                        className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                          vendorTab === category
                            ? 'border-rose-500 text-rose-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vendor Cards */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shortlistedVendors
                      .filter(vendor => vendorTab === 'all-vendors' || vendor.category === vendorTab)
                      .map((vendor) => (
                        <div key={vendor.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors border border-gray-200">
                          {/* Vendor Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">{vendor.name}</h4>
                              <p className="text-sm text-gray-600">{vendor.category}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              vendor.status === 'selected'
                                ? 'bg-sage-100 text-sage-800'
                                : vendor.status === 'shortlisted'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {vendor.status}
                            </div>
                          </div>

                          {/* Pricing Information */}
                          <div className="space-y-3 mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Quoted Amount</span>
                              <span className="font-bold text-gray-900">₹{vendor.quotedAmount.toLocaleString()}</span>
                            </div>
                            
                            {vendor.discount > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Original Price</span>
                                <span className="text-sm text-gray-500 line-through">₹{vendor.originalPrice.toLocaleString()}</span>
                              </div>
                            )}
                            
                            {vendor.discount > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-sage-600">Savings</span>
                                <span className="text-sm font-medium text-sage-600">₹{vendor.discount.toLocaleString()}</span>
                              </div>
                            )}

                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Advance Required</span>
                              <span className="text-sm font-medium text-rose-600">₹{vendor.advanceRequired.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* AI Analysis */}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">AI Rating</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-rose-500 fill-current" />
                                <span className="text-sm font-medium">{vendor.aiRating.toFixed(1)}</span>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Market Position</span>
                              <span className={`text-sm font-medium ${
                                vendor.marketPosition === 'below' ? 'text-sage-600' :
                                vendor.marketPosition === 'average' ? 'text-gray-600' : 'text-rose-600'
                              }`}>
                                {vendor.marketPosition === 'below' ? 'Below Market' :
                                 vendor.marketPosition === 'average' ? 'Market Rate' : 'Above Market'}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Confidence</span>
                              <span className="text-sm font-medium text-gray-600">{vendor.confidence}%</span>
                            </div>
                          </div>

                          {/* Payment Terms */}
                          <div className="border-t border-gray-200 pt-3">
                            <span className="text-xs text-gray-500 block">Payment Terms:</span>
                            <span className="text-xs text-gray-700">{vendor.paymentTerms || 'Standard terms apply'}</span>
                          </div>

                          {/* Progress Indicator */}
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Budget Allocation</span>
                              <span>{((vendor.quotedAmount / totalBudget) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  vendor.status === 'selected' ? 'bg-sage-500' :
                                  vendor.status === 'shortlisted' ? 'bg-gray-500' : 'bg-gray-400'
                                }`}
                                style={{
                                  width: `${Math.min((vendor.quotedAmount / totalBudget) * 100, 100)}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Category Summary */}
                  {vendorTab !== 'all-vendors' && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">{vendorTab} Category Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-700">Total Quoted:</span>
                          <span className="font-bold text-gray-900 ml-2">
                            ₹{shortlistedVendors
                              .filter(v => v.category === vendorTab)
                              .reduce((sum, v) => sum + v.quotedAmount, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-700">Total Savings:</span>
                          <span className="font-bold text-sage-600 ml-2">
                            ₹{shortlistedVendors
                              .filter(v => v.category === vendorTab)
                              .reduce((sum, v) => sum + v.discount, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-700">Vendors:</span>
                          <span className="font-bold text-gray-900 ml-2">
                            {shortlistedVendors.filter(v => v.category === vendorTab).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Budget Recommendations */}
            {weddingPreferences && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-sage-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-sage-900">AI Budget Insights</h3>
                    <p className="text-sm text-sage-700">Smart recommendations based on your preferences</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">Guest Count Impact</span>
                    </div>
                    <p className="text-sm text-gray-800">
                      For {weddingPreferences.basicDetails?.guestCount || 100} guests, your per-person budget is ₹{Math.round(totalBudget / (weddingPreferences.basicDetails?.guestCount || 100)).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-sage-600" />
                      <span className="font-medium text-sage-900">Budget Health</span>
                    </div>
                    <p className="text-sm text-sage-800">
                      {budgetUtilization < 70 ? 'Good progress! You\'re within budget.' : 
                       budgetUtilization < 90 ? 'Monitor spending closely.' : 
                       'Consider budget adjustments.'}
                    </p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span className="font-medium text-rose-900">Priority Areas</span>
                    </div>
                    <p className="text-sm text-rose-800">
                      {selectedEvents.includes('mandap-ceremony') ? 'Main ceremony is your highest expense' :
                       selectedEvents.includes('reception') ? 'Reception requires significant budget' :
                       'Focus on essential events first'}
                    </p>
                  </div>
                </div>

                {/* Cost-saving tips from blueprint */}
                {blueprintData?.cost_saving_tips && (
                  <div className="mt-4 bg-white/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-emerald-900">AI Cost-Saving Tips</span>
                    </div>
                    {Array.isArray(blueprintData.cost_saving_tips) ? (
                      <ul className="text-sm text-emerald-800 space-y-1 list-disc list-inside">
                        {blueprintData.cost_saving_tips.map((tip: string, idx: number) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-emerald-800">{blueprintData.cost_saving_tips}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-sage-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-sage-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
                  <p className="text-sm text-gray-600">Your latest expenses and payments</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: transaction.type === 'expense' ? '#df8e8e' : '#10B981' }}>
                        {transaction.type === 'expense' ? (
                          <TrendingDown className="h-5 w-5 text-white" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                        <p className="text-sm text-gray-600">{transaction.category} • {transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        transaction.type === 'expense' ? 'text-rose-600' : 'text-sage-600'
                      }`}>
                        {transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
          {showAddTransaction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Add Transaction</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-gray-400"
                      style={{ '--tw-ring-color': 'rgba(223, 142, 142, 0.3)' } as React.CSSProperties}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-gray-400"
                      style={{ '--tw-ring-color': 'rgba(223, 142, 142, 0.3)' } as React.CSSProperties}
                      placeholder="Enter transaction description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-gray-400"
                      style={{ '--tw-ring-color': 'rgba(223, 142, 142, 0.3)' } as React.CSSProperties}
                      placeholder="Enter amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value as 'expense' | 'income'})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-gray-400"
                      style={{ '--tw-ring-color': 'rgba(223, 142, 142, 0.3)' } as React.CSSProperties}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddTransaction(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTransaction}
                    className="flex-1 px-4 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#df8e8e' }}
                  >
                    Add Transaction
                  </button>
                </div>
              </div>
            </div>
          )}

      {/* Placeholder for Save Button - This section was replaced */}
      {/* Original Save button was removed and replaced with new buttons */}
    </div>
  );
};

export default BudgetManagement;
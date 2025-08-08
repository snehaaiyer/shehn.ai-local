
#!/usr/bin/env python3
"""
Vector Database Implementation for RAG-Enhanced Vendor Search
Uses Chroma for local vector storage and embeddings
"""

import chromadb
import logging
from typing import Dict, List, Any, Optional
from sentence_transformers import SentenceTransformer
import json
import numpy as np
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class VendorDocument:
    """Vendor document for vector storage"""
    vendor_id: str
    content: str
    metadata: Dict[str, Any]
    embedding: Optional[List[float]] = None

class VectorRAGDatabase:
    """
    Vector database implementation for vendor RAG system
    """
    
    def __init__(self, collection_name: str = "wedding_vendors"):
        self.collection_name = collection_name
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Create or get collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        
        logger.info(f"✅ Vector database initialized with collection: {collection_name}")
    
    def add_vendor_documents(self, vendor_documents: List[VendorDocument]):
        """Add vendor documents to vector database"""
        try:
            documents = []
            metadatas = []
            ids = []
            embeddings = []
            
            for doc in vendor_documents:
                # Generate embedding if not provided
                if doc.embedding is None:
                    embedding = self.embedding_model.encode(doc.content).tolist()
                else:
                    embedding = doc.embedding
                
                documents.append(doc.content)
                metadatas.append(doc.metadata)
                ids.append(doc.vendor_id)
                embeddings.append(embedding)
            
            # Add to collection
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids,
                embeddings=embeddings
            )
            
            logger.info(f"✅ Added {len(vendor_documents)} vendor documents to vector database")
            
        except Exception as e:
            logger.error(f"Error adding vendor documents: {e}")
    
    def search_similar_vendors(self, 
                              query: str, 
                              category: str = None,
                              location: str = None,
                              top_k: int = 10) -> List[Dict]:
        """Search for similar vendors using vector similarity"""
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode(query).tolist()
            
            # Build where clause for filtering
            where_clause = {}
            if category:
                where_clause["category"] = category
            if location:
                where_clause["location"] = location
            
            # Search vector database
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_clause if where_clause else None,
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results
            similar_vendors = []
            if results and results['documents']:
                for i, doc in enumerate(results['documents'][0]):
                    vendor_data = {
                        'id': results['ids'][0][i],
                        'content': doc,
                        'metadata': results['metadatas'][0][i],
                        'similarity_score': 1 - results['distances'][0][i],  # Convert distance to similarity
                        'rank': i + 1
                    }
                    similar_vendors.append(vendor_data)
            
            logger.info(f"🔍 Found {len(similar_vendors)} similar vendors for query: '{query}'")
            return similar_vendors
            
        except Exception as e:
            logger.error(f"Error searching similar vendors: {e}")
            return []
    
    def get_vendor_context(self, vendor_id: str) -> Optional[Dict]:
        """Get vendor context from vector database"""
        try:
            results = self.collection.get(
                ids=[vendor_id],
                include=["documents", "metadatas"]
            )
            
            if results and results['documents']:
                return {
                    'id': vendor_id,
                    'content': results['documents'][0],
                    'metadata': results['metadatas'][0]
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting vendor context: {e}")
            return None
    
    def update_vendor_knowledge(self, 
                               vendor_id: str, 
                               new_knowledge: Dict[str, Any]):
        """Update vendor knowledge in vector database"""
        try:
            # Get existing vendor
            existing = self.get_vendor_context(vendor_id)
            if not existing:
                logger.warning(f"Vendor {vendor_id} not found for update")
                return
            
            # Update metadata
            updated_metadata = {**existing['metadata'], **new_knowledge}
            
            # Update content with new knowledge
            updated_content = f"{existing['content']} {json.dumps(new_knowledge)}"
            
            # Generate new embedding
            new_embedding = self.embedding_model.encode(updated_content).tolist()
            
            # Update in collection
            self.collection.update(
                ids=[vendor_id],
                documents=[updated_content],
                metadatas=[updated_metadata],
                embeddings=[new_embedding]
            )
            
            logger.info(f"✅ Updated knowledge for vendor: {vendor_id}")
            
        except Exception as e:
            logger.error(f"Error updating vendor knowledge: {e}")
    
    def populate_initial_vendor_data(self):
        """Populate vector database with initial vendor data"""
        try:
            # Sample vendor data for demonstration
            sample_vendors = [
                VendorDocument(
                    vendor_id="venue_001",
                    content="Taj Palace Mumbai luxury wedding venue with grand ballrooms, 500 guest capacity, premium catering, heritage architecture, waterfront views, royal ambiance",
                    metadata={
                        "category": "venues",
                        "name": "Taj Palace Mumbai",
                        "location": "Mumbai",
                        "capacity": 500,
                        "price_range": "₹8-15L",
                        "rating": 4.8,
                        "amenities": ["luxury", "waterfront", "heritage", "catering"],
                        "verified": True
                    }
                ),
                VendorDocument(
                    vendor_id="photo_001",
                    content="Elite Wedding Photography candid traditional pre-wedding drone cinematic 4K professional equipment award-winning Mumbai photographer portfolio",
                    metadata={
                        "category": "photography",
                        "name": "Elite Wedding Photography",
                        "location": "Mumbai",
                        "price_range": "₹2-3L",
                        "rating": 4.7,
                        "styles": ["candid", "traditional", "cinematic"],
                        "equipment": ["drone", "4K", "professional"],
                        "verified": True
                    }
                ),
                VendorDocument(
                    vendor_id="catering_001",
                    content="Royal Caterers Mumbai north indian south indian continental vegetarian non-vegetarian live counter thali buffet 200-1000 guests premium catering",
                    metadata={
                        "category": "catering",
                        "name": "Royal Caterers",
                        "location": "Mumbai",
                        "price_range": "₹1200-2500 per plate",
                        "rating": 4.5,
                        "cuisines": ["north indian", "south indian", "continental"],
                        "dietary": ["vegetarian", "non-vegetarian"],
                        "service_style": ["live counter", "thali", "buffet"],
                        "verified": True
                    }
                )
            ]
            
            self.add_vendor_documents(sample_vendors)
            logger.info("✅ Initial vendor data populated in vector database")
            
        except Exception as e:
            logger.error(f"Error populating initial data: {e}")

# Integration with existing RAG system
class EnhancedRAGVendorExtractor:
    """
    Enhanced RAG system with vector database integration
    """
    
    def __init__(self):
        self.vector_db = VectorRAGDatabase()
        self.vector_db.populate_initial_vendor_data()
    
    def extract_enhanced_vendor_info_with_vectors(self, 
                                                 raw_vendor_data: Dict, 
                                                 search_context: Dict) -> Dict:
        """Extract vendor info using vector RAG enhancement"""
        try:
            vendor_name = raw_vendor_data.get('name', '')
            category = raw_vendor_data.get('category', '')
            location = search_context.get('location', '')
            
            # Search for similar vendors in vector database
            query = f"{vendor_name} {category} {location}"
            similar_vendors = self.vector_db.search_similar_vendors(
                query=query,
                category=category,
                location=location,
                top_k=5
            )
            
            # Enhance vendor data with vector search results
            enhanced_info = raw_vendor_data.copy()
            
            if similar_vendors:
                # Get best match
                best_match = similar_vendors[0]
                
                if best_match['similarity_score'] > 0.7:  # High similarity threshold
                    # Use vector database metadata to enhance vendor info
                    vector_metadata = best_match['metadata']
                    
                    enhanced_info.update({
                        'vector_enhanced': True,
                        'similarity_score': best_match['similarity_score'],
                        'enhanced_rating': vector_metadata.get('rating', raw_vendor_data.get('rating', 0)),
                        'enhanced_price_range': vector_metadata.get('price_range', ''),
                        'verified_amenities': vector_metadata.get('amenities', []),
                        'market_context': {
                            'similar_vendors_found': len(similar_vendors),
                            'market_position': self._calculate_market_position(enhanced_info, similar_vendors),
                            'competitive_analysis': self._generate_competitive_analysis(similar_vendors)
                        }
                    })
            
            # Add vector search context
            enhanced_info['vector_context'] = {
                'search_query': query,
                'similar_vendors_count': len(similar_vendors),
                'top_similarity_scores': [v['similarity_score'] for v in similar_vendors[:3]]
            }
            
            return enhanced_info
            
        except Exception as e:
            logger.error(f"Vector RAG enhancement error: {e}")
            return raw_vendor_data
    
    def _calculate_market_position(self, vendor_info: Dict, similar_vendors: List[Dict]) -> str:
        """Calculate vendor's market position based on similar vendors"""
        try:
            vendor_rating = vendor_info.get('rating', 0)
            similar_ratings = [v['metadata'].get('rating', 0) for v in similar_vendors]
            
            if not similar_ratings:
                return "Unknown"
            
            avg_rating = np.mean(similar_ratings)
            
            if vendor_rating > avg_rating + 0.5:
                return "Premium"
            elif vendor_rating < avg_rating - 0.5:
                return "Budget"
            else:
                return "Standard"
                
        except Exception:
            return "Unknown"
    
    def _generate_competitive_analysis(self, similar_vendors: List[Dict]) -> Dict:
        """Generate competitive analysis from similar vendors"""
        try:
            if not similar_vendors:
                return {}
            
            categories = {}
            avg_ratings = []
            price_ranges = []
            
            for vendor in similar_vendors:
                metadata = vendor.get('metadata', {})
                category = metadata.get('category', 'unknown')
                categories[category] = categories.get(category, 0) + 1
                
                if metadata.get('rating'):
                    avg_ratings.append(metadata['rating'])
                
                if metadata.get('price_range'):
                    price_ranges.append(metadata['price_range'])
            
            return {
                'categories_distribution': categories,
                'average_market_rating': np.mean(avg_ratings) if avg_ratings else 0,
                'common_price_ranges': list(set(price_ranges[:3])),
                'market_competitiveness': 'High' if len(similar_vendors) > 8 else 'Moderate'
            }
            
        except Exception:
            return {}

# Example usage
if __name__ == "__main__":
    # Test vector RAG system
    print("🧠 Testing Vector RAG Implementation...")
    
    enhanced_rag = EnhancedRAGVendorExtractor()
    
    # Test search
    test_vendor = {
        'name': 'Grand Wedding Venue',
        'category': 'venues',
        'location': 'Mumbai',
        'rating': 4.5
    }
    
    search_context = {
        'location': 'Mumbai',
        'budget_range': '₹10-20L',
        'guest_count': 300
    }
    
    enhanced_result = enhanced_rag.extract_enhanced_vendor_info_with_vectors(
        test_vendor, 
        search_context
    )
    
    print(f"✅ Vector RAG Enhancement Complete:")
    print(f"   Vector Enhanced: {enhanced_result.get('vector_enhanced', False)}")
    print(f"   Similarity Score: {enhanced_result.get('similarity_score', 0):.2f}")
    print(f"   Market Position: {enhanced_result.get('market_context', {}).get('market_position', 'Unknown')}")

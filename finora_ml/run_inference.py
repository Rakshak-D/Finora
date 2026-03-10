import sys
import os

# Ensure the finora_ml package is accessible
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from finora_ml.pipeline import setup_pipeline, run_event_pipeline
from finora_ml.schemas import EventInput, InvestorPersona, Sector

def main():
    print("========================================")
    print("   Finora ML Event Pipeline Inference   ")
    print("========================================")
    print("Initializing Database and Models... (This might take a few seconds)")
    setup_pipeline()
    
    print("\n--- Setup Complete ---")
    
    while True:
        print("\n" + "="*40)
        event_text = input("Enter a financial news event (or type 'exit' to quit):\n> ")
        
        if event_text.lower().strip() == 'exit':
            break
            
        if not event_text.strip():
            continue
            
        print("\nAnalyzing Event...")
        
        # 1. Create the Event Input
        event = EventInput(text=event_text)
        
        # 2. Optionally, create a Mock Persona
        # For testing, we create a user who holds IT and Banking stocks, worth 100,000 INR
        mock_persona = InvestorPersona(
            sectors=[Sector.IT, Sector.BANKING],
            portfolio_value=100000.0
        )
        
        # 3. Run Pipeline Data into JSON format
        result = run_event_pipeline(
            event=event, 
            persona=mock_persona, 
            run_history=True, 
            run_gemini=True
        )
        
        # 4. Print results
        print("\n--- Analysis Results ---")
        print(f"Primary Sector: {result.classification.primary_sector.upper()}")
        print(f"Event Type: {result.classification.event_type}")
        print(f"Sentiment: {result.sentiment.label.value.upper()} (Score: {result.sentiment.score})")
        print(f"Overall Signal Score: {result.signal_score}/100")
        
        print("\n--- History Echo (Similar Past Events) ---")
        if result.history_echo and result.history_echo.parallels:
            print(result.history_echo.echo_summary)
            for i, p in enumerate(result.history_echo.parallels[:2]): # Show top 2
                print(f"  {i+1}. [{p.event_date}] {p.event_summary[:80]}... (Sim: {p.similarity_score:.2f})")
        else:
            print("No significant historical parallels found.")
            
        print("\n--- Gemini Domino Chain Prediction ---")
        if result.domino_chain:
            for node in result.domino_chain.chain:
                direction_symbol = "↑" if node.direction == "up" else "↓" if node.direction == "down" else "→"
                print(f"  • {node.sector.capitalize()}: {direction_symbol} ({node.magnitude} impact) - {node.reason}")
                
            if result.domino_chain.user_impact:
                print(f"\n  User Impact Context: {result.domino_chain.user_impact}")
                
        print("\n--- Personalized Gemini Summary ---")
        print(f"  {result.persona_summary}")
        
if __name__ == "__main__":
    main()

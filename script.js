
class MealService {
    constructor() {
        this.baseUrl = 'https://open.neis.go.kr/hub/mealServiceDietInfo';
        this.schoolCode = '7530079'; // 산본고등학교
        this.officeCode = 'J10'; // 경기도교육청
        
        this.init();
    }
    
    init() {
        const dateInput = document.getElementById('meal-date');
        const searchBtn = document.getElementById('search-btn');
        
        // 오늘 날짜를 기본값으로 설정
        const today = new Date();
        dateInput.value = this.formatDate(today);
        
        // 이벤트 리스너 등록
        searchBtn.addEventListener('click', () => this.searchMeal());
        dateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchMeal();
            }
        });
        
        // 페이지 로드 시 오늘 급식 정보 조회
        this.searchMeal();
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    formatDateForAPI(dateString) {
        return dateString.replace(/-/g, '');
    }
    
    formatDateForDisplay(dateString) {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        
        const date = new Date(year, month - 1, day);
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = days[date.getDay()];
        
        return `${year}년 ${month}월 ${day}일 (${dayName})`;
    }
    
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('meal-info').classList.add('hidden');
        document.getElementById('error-message').classList.add('hidden');
    }
    
    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }
    
    showError(message) {
        this.hideLoading();
        const errorDiv = document.getElementById('error-message');
        const errorDetail = errorDiv.querySelector('.error-detail');
        errorDetail.textContent = message;
        errorDiv.classList.remove('hidden');
        document.getElementById('meal-info').classList.add('hidden');
    }
    
    async searchMeal() {
        const dateInput = document.getElementById('meal-date');
        const selectedDate = dateInput.value;
        
        if (!selectedDate) {
            alert('날짜를 선택해주세요.');
            return;
        }
        
        this.showLoading();
        
        try {
            const formattedDate = this.formatDateForAPI(selectedDate);
            const url = `${this.baseUrl}?ATPT_OFCDC_SC_CODE=${this.officeCode}&SD_SCHUL_CODE=${this.schoolCode}&MLSV_YMD=${formattedDate}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            this.displayMealInfo(xmlDoc, formattedDate);
            
        } catch (error) {
            console.error('Error fetching meal data:', error);
            this.showError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
    }
    
    displayMealInfo(xmlDoc, date) {
        this.hideLoading();
        
        const mealInfoDiv = document.getElementById('meal-info');
        const errorDiv = document.getElementById('error-message');
        
        // 오류 체크
        const errorElement = xmlDoc.querySelector('RESULT > CODE');
        if (errorElement && errorElement.textContent !== 'INFO-000') {
            const errorMessage = xmlDoc.querySelector('RESULT > MESSAGE');
            this.showError(errorMessage ? errorMessage.textContent : '급식 정보를 찾을 수 없습니다.');
            return;
        }
        
        const mealRows = xmlDoc.querySelectorAll('row');
        
        if (mealRows.length === 0) {
            this.showError('해당 날짜의 급식 정보가 없습니다.');
            return;
        }
        
        errorDiv.classList.add('hidden');
        mealInfoDiv.classList.remove('hidden');
        
        const mealCard = mealInfoDiv.querySelector('.meal-card');
        const formattedDate = this.formatDateForDisplay(date);
        
        let mealHtml = `
            <h2>🍽️ 급식 정보</h2>
            <div class="meal-date">${formattedDate}</div>
        `;
        
        mealRows.forEach(row => {
            const mealType = row.querySelector('MMEAL_SC_NM')?.textContent || '급식';
            const menuItems = row.querySelector('DDISH_NM')?.textContent || '';
            
            if (menuItems) {
                // 메뉴 아이템을 줄바꿈으로 분리하고 알레르기 정보 정리
                const items = menuItems.split('<br/>')
                    .map(item => item.replace(/\([^)]*\)/g, '').trim())
                    .filter(item => item.length > 0);
                
                mealHtml += `
                    <div class="meal-menu">
                        <h3>${mealType}</h3>
                        <div class="menu-items">
                            ${items.map(item => `<span class="menu-item">${item}</span>`).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        mealCard.innerHTML = mealHtml;
    }
}

// 페이지 로드 시 MealService 초기화
document.addEventListener('DOMContentLoaded', () => {
    new MealService();
});

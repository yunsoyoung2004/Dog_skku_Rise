import { useState } from 'react';
import './LocationSelectModal.css';

const locations = {
  서울: {
    zones: ['강남구', '강북구', '강서구', '관악구', '광진구'],
    districts: {
      강남구: ['강남', '역삼동', '삼성동', '논현동', '청담동'],
      강북구: ['수유동', '미아동', '번동', '우이동'],
      강서구: ['화곡동', '목동', '등촌동', '염창동'],
      관악구: ['신림동', '봉천동', '낙성대동'],
      광진구: ['자양동', '중곡동', '능동'],
    },
  },
  경기: {
    zones: ['수원', '성남', '고양', '용인', '부천'],
    districts: {
      수원: ['장안구', '권선구', '팔달구', '영통구'],
      성남: ['분당구', '수정구', '중원구'],
      고양: ['덕양구', '일산동구', '일산서구'],
      용인: ['기흥구', '수지구', '처인구'],
      부천: ['원미구', '소사구', '오정구'],
    },
  },
  인천: {
    zones: ['남동구', '연수구', '남서구', '중구'],
    districts: {
      남동구: ['간석동', '만수동', '남촌동'],
      연수구: ['송도동', '연수동', '옥련동'],
      남서구: ['검단동', '신천동'],
      중구: ['운서동', '영종동'],
    },
  },
  강원: {
    zones: ['춘천', '원주', '강릉', '속초'],
    districts: {
      춘천: ['중앙로', '약사동'],
      원주: ['일산동', '귀래'],
      강릉: ['교동', '창동'],
      속초: ['도심', '노학동'],
    },
  },
  대전: {
    zones: ['동구', '중구', '서구', '유성구'],
    districts: {
      동구: ['전동', '가양동', '대별동'],
      중구: ['중앙동', '대흥동'],
      서구: ['둔산동', '정동'],
      유성구: ['봉명동', '노은동'],
    },
  },
};

export default function LocationSelectModal({ isOpen, onClose, onSelectLocation }) {
  const [currentRegion, setCurrentRegion] = useState('서울');
  const [currentZone, setCurrentZone] = useState('강남구');
  const [currentDistrict, setCurrentDistrict] = useState('강남');

  if (!isOpen) return null;

  const handleZoneSelect = (zone) => {
    setCurrentZone(zone);
    const districts = locations[currentRegion].districts[zone];
    setCurrentDistrict(districts[0]);
  };

  const handleDistrictSelect = (district) => {
    setCurrentDistrict(district);
  };

  const handleConfirm = () => {
    onSelectLocation({
      region: currentRegion,
      zone: currentZone,
      district: currentDistrict,
    });
    onClose();
  };

  const handleRegionChange = (region) => {
    setCurrentRegion(region);
    const firstZone = locations[region].zones[0];
    setCurrentZone(firstZone);
    const firstDistrict = locations[region].districts[firstZone][0];
    setCurrentDistrict(firstDistrict);
  };

  const currentZones = locations[currentRegion].zones;
  const currentDistricts = locations[currentRegion].districts[currentZone] || [];

  return (
    <div className="location-modal-overlay" onClick={onClose}>
      <div className="location-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="location-modal-header">
          <h3>지역 선택</h3>
          <button className="location-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 지역 선택 그리드 */}
        <div className="location-grid">
          {/* Column 1: 시도 */}
          <div className="location-column">
            <div className="location-column-header">시도</div>
            <div className="location-column-items">
              {Object.keys(locations).map((region) => (
                <button
                  key={region}
                  className={`location-item ${currentRegion === region ? 'active' : ''}`}
                  onClick={() => handleRegionChange(region)}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: 구/군 */}
          <div className="location-column">
            <div className="location-column-header">구/군</div>
            <div className="location-column-items">
              {currentZones.map((zone) => (
                <button
                  key={zone}
                  className={`location-item ${currentZone === zone ? 'active' : ''}`}
                  onClick={() => handleZoneSelect(zone)}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          {/* Column 3: 동 */}
          <div className="location-column">
            <div className="location-column-header">동</div>
            <div className="location-column-items">
              {currentDistricts.map((district) => (
                <button
                  key={district}
                  className={`location-item ${currentDistrict === district ? 'active' : ''}`}
                  onClick={() => handleDistrictSelect(district)}
                >
                  {district}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 확인 버튼 */}
        <button className="location-modal-confirm" onClick={handleConfirm}>
          확인
        </button>
      </div>
    </div>
  );
}

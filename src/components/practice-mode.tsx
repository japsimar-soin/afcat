"use client";

import { PracticeImage } from "./practice-image";
import { UserInput } from "./user-input";

export function PracticeMode() {
	return (
		<div>
			<div>
				<PracticeImage />
			</div>
			<div>
        <UserInput></UserInput>
      </div>
		</div>
	);
}
